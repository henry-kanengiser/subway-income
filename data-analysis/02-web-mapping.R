### subway-income project ###

######## 2. Web Mapping Prep ########

# The PURPOSE of this script is to prepare the files developed in the previous
# script for being placed into a MapBox GL JS website. 

# The files that need to be prepared will include the following info:
#   - Subway station point location, linked to 
#       the daytime subway lines that serve that station
#       median HH income at that subway station (2022 & 2017 5-year estimates)
#   - Subway line summary information which can be linked to the lines


# 0. Packages ----
library(tidyverse)
library(sf)
library(janitor)
library(tidycensus)
library(tmap)

#prepare for interactive mapping
tmap_mode("view")


# 1. Read in data -------------------------------------------------------------
# subway_lines <- st_read("dat/nyc-subway-routes-segments.geojson")

subway_lines_nosi <- st_read("https://data.cityofnewyork.us/resource/s7zz-qmyz.geojson")

# this doesn't include SI, so add it in separately
si <- st_read("dat/nyc-subway-routes-segments.geojson") %>%
  filter(rt_symbol == "SI") %>%
  mutate(objectid = as.character(cartodb_id))


# 2. Reformat for web mapping -------------------------------------------------

subway_lines <- bind_rows(
  subway_lines_nosi %>% select(name, objectid, rt_symbol, geometry),
  si %>%                select(name, objectid, rt_symbol, geometry)
)

# subway lines file uses different line segments for each portion of rail
#  and needs a flag for each route that should be highlighted by the line
#  use the same flag code used to flag stations

# do this step without geometry and join it back on later
subway_lines2 <- st_drop_geometry(subway_lines)

subway_lines_geo <- select(subway_lines, objectid, geometry)

# create list of subway routes to use in the function step below
routes <- c("1", "2", "3", "4", "5", "6", "7", "A", "B", "C", "D", "E", "F", 
            "G", "S", "J", "L", "M", "N", "Q", "R", "W", "Z", "SI")

# create flags version that can be used too
flags <- paste0("flag", routes)

# use a purrr::map() function to flag each segment for each train route
#  outputted file will have 24 flag vars, one for each route
subway_lines3 <- routes %>%
  map(~ subway_lines2 %>%
        mutate(.x = as.numeric(grepl(.x, name, ignore.case=TRUE))) %>%
        select(.x) %>%
        set_names(paste0("flag", .x))) %>%
  bind_cols(subway_lines2, .) %>%
  # fix issue with R train capturing SIR stations too
  mutate(flagR = ifelse(flagSI == 1, 0, flagR)) %>%
  left_join(subway_lines_geo, by = "objectid") %>%
  st_as_sf() %>%
  select(-rt_symbol)


# now, use another purrr function to union all segments based on each flag 
#  individually, and combine them together into one dataframe
subway_lines4 <- map_dfr(flags, ~ subway_lines3 %>%
      filter(!!sym(.x) == 1) %>%
        st_union() %>%
        as.data.frame() %>%
        mutate(route = .x) %>%
        st_as_sf() 
      ) %>%
  mutate(route = (str_remove(route, "flag")))

# map the routes, with different colors for each route
tm_shape(subway_lines4) + 
  tm_lines("route", lwd = 3)

# now add rt_symbol back onto the file to align with the styling script
subway_lines5 <- subway_lines4 %>%
  rowwise() %>%
  mutate(rt_symbol = case_when(
    route %in% c("1", "2", "3") ~ "1",
    route %in% c("4", "5", "6") ~ "4",
    route == "7"                ~ "7",
    route %in% c("A", "C", "E") ~ "A",
    route %in% c("B", 'D', 'F', 'M') ~ "B",
    route == "G"                ~ "G",
    route %in% c("J", "Z")      ~ "J",
    route == "L"                ~ "L",
    route %in% c("N", "Q", "R", "W") ~ "N",
    route == "SI"               ~ "SI",
    route == "S"                ~ "S"
  ))

# check that this looks right
subway_lines5 %>%
  st_drop_geometry() %>%
  count(rt_symbol, route)

# now create bounding box vars that can be joined on for map dynamic activities
subway_lines6 <- subway_lines5 %>%
  cbind(map_dfr(subway_lines5$geometry, st_bbox))


# 3. Save as geojson to read in the mapping project ---------------------------
st_write(subway_lines6, "dat/nyc-subway-routes.geojson", delete_dsn = T)



