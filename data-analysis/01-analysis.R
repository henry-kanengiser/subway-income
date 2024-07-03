### subway-income project ###

######## 1. Analysis ########

# The PURPOSE of this script is to read in subway station and income data to 
# generate current and historical trends in income of residents surrounding
# subway stations.

# The final result will be relative income of residents along each subway
# line as well as a station-level map showing income near each stop


# 0. Packages ----
library(tidyverse)
library(sf)
library(janitor)
library(tidycensus)
library(tmap)

#prepare for interactive mapping
tmap_mode("view")


# 1. Read in files ------------------------------------------------------------

## 1a. Read in MTA data
stations <- read_csv("https://data.ny.gov/resource/39hk-dx4f.csv")

## 1b. Read in Census data
# Variable codes from the ACS data:
#   
# -   B01001_001 | Total population
# -   B19001_001 | Number of households
# -   B19013_001 | Median household income
# 
# Read in two time periods of ACS data
# 
# -   2018-2022 (most recent)
# -   2013-2017 (longer ago)

tract22 <- get_acs(
  geography = "tract",
  variables = c(
    pop  = "B01001_001",
    nhh  = "B19001_001",
    mhhi = "B19013_001"),
  state = "New York",
  geometry = TRUE,
  year = 2022
) %>%
  clean_names() %>%
  filter(grepl("Bronx|Kings|New York County|Queens|Richmond", name)) %>%
  mutate(moerate = moe/estimate) %>%
  pivot_wider(id_cols = c("geoid", "name", "geometry"),
              names_from = "variable",
              names_glue = "{variable}{.value}",
              values_from = c("estimate", "moe", "moerate")) %>%
  mutate(borough = case_when(
    grepl("New York County", name) ~ "New York",
    grepl("Bronx", name) ~ "Bronx",
    grepl("Kings", name) ~ "Kings",
    grepl("Queens", name) ~ "Queens",
    grepl("Richmond", name) ~ "Richmond",))

tract17 <- get_acs(
  geography = "tract",
  variables = c(
    pop  = "B01001_001",
    nhh  = "B19001_001",
    mhhi = "B19013_001"),
  state = "New York",
  geometry = TRUE,
  year = 2017
) %>%
  clean_names() %>%
  filter(grepl("Bronx|Kings|New York County|Queens|Richmond", name)) %>%
  mutate(moerate = moe/estimate) %>%
  pivot_wider(id_cols = c("geoid", "name", "geometry"),
              names_from = "variable",
              names_glue = "{variable}{.value}",
              values_from = c("estimate", "moe", "moerate")) %>%
  mutate(borough = case_when(
    grepl("New York County", name) ~ "New York",
    grepl("Bronx", name) ~ "Bronx",
    grepl("Kings", name) ~ "Kings",
    grepl("Queens", name) ~ "Queens",
    grepl("Richmond", name) ~ "Richmond",))


# 2. Manipulate data ----------------------------------------------------------

## 2a. Subway station manipulation ----
## Create flags for each subway line

lines <- c("1", "2", "3", "4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", 
           "S", "J", "L", "M", "N", "Q", "R", "W", "Z", "SI")

stations2 <- lines %>%
  map(~ stations %>%
        mutate(.x = as.numeric(grepl(.x, daytime_routes, ignore.case=TRUE))) %>%
        select(.x) %>%
        set_names(paste0("flag", .x))) %>%
  bind_cols(stations, .) %>%
  # fix issue with R train capturing SIR stations too
  mutate(flagR = ifelse(flagSI == 1, 0, flagR),
  # create separate flag vars for shuttles in Manhattan, Brooklyn, & Queens
         flagSM = ifelse(flagS == 1 & borough == "M", 1, 0),
         flagSB = ifelse(flagS == 1 & borough == "Bk", 1, 0),
         flagSQ = ifelse(flagS == 1 & borough == "Q", 1, 0)) %>%
  select(-flagS)

# check: nflagSB# check: number of rows in each flag should gut check match up with the world
stations2 %>%
  select(starts_with("flag")) %>%
  summarise_all(sum) %>%
  pivot_longer(cols = everything(), names_to = "train", values_to = "nstations") %>%
  mutate(train = substr(train, nchar(train), nchar(train))) %>%
  arrange(desc(nstations))


## Convert to spatial data & add 1/2 mile buffer
stations_sf <- stations2 %>%
  st_as_sf(wkt = "georeference", crs = st_crs(4326)) %>%
  st_transform(st_crs(2263))

stations_buffer <- st_buffer(stations_sf, dis = 2640)

# check: do buffers look like the right size?
tm_shape(stations_buffer) + 
  tm_polygons(daytime)


## 2b. Census data manipulation ----

# simplify datasets
## Note that the two datasets cannot be merged because they rely on different
##  geometries (2010 and 2020 block group borders)
tract22_2 <- tract22 %>%
  select(geoid, pop = popestimate, nhh = nhhestimate, mhhi = mhhiestimate, geometry) %>%
  st_transform(crs = st_crs(2263))

# 2017 data should be inflation adjusted to 2022 dollars
# $1 in 2017 is worth $1.19 in 2022 (https://www.officialdata.org/us/inflation/2017?endYear=2022&amount=1)
tract17_2 <- tract17 %>%
  select(geoid, pop = popestimate, nhh = nhhestimate, mhhi17d = mhhiestimate, geometry) %>%
  mutate(mhhi = mhhi17d * 1.1939) %>%
  st_transform(crs = st_crs(2263))

# create centroid version of each file to intersect with the buffers
tract22_c <- st_centroid(tract22_2)
tract17_c <- st_centroid(tract17_2)


# 3. Link census data to subway stations --------------------------------------

# Intersect the station buffers layer with the tract data
statbufftract22_point <- stations_buffer %>%
  st_intersection(tract22_c)

statbufftract17_point <- stations_buffer %>%
  st_intersection(tract17_c)

# Intersect the station points with the tract polygons
statbufftract22_poly <- stations_sf %>%
  st_intersection(tract22_2)

statbufftract17_poly <- stations_sf %>%
  st_intersection(tract17_2)

# Join these two intersections together and deduplicate based on geoid & station id
statbufftract22 <- bind_rows(statbufftract22_point, statbufftract22_poly) %>%
  # deduplicate if the same census tract is caught through both methods
  distinct(gtfs_stop_id, geoid, .keep_all = T)

statbufftract17 <- bind_rows(statbufftract17_point, statbufftract17_poly) %>%
  # deduplicate if the same census tract is caught through both methods
  distinct(gtfs_stop_id, geoid, .keep_all = T)

### Checks on this intersection ----
## How many stations are in the file?
statbufftract22 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  nrow()

### which stations aren't in the file anymore?
intersected <- statbufftract22 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  pull(station_id)

stations %>%
  st_drop_geometry() %>%
  filter(!station_id %in% intersected) %>%
  View()

### these tracts are very large, so none are within the buffer. instead we need
###  to add the tracts that the station is within to ensure every station has
###  at least one tract associated with it

## How many census tracts are in the file?
statbufftract22 %>%
  st_drop_geometry() %>%
  distinct(geoid) %>%
  nrow()

glimpse(statbufftract22)

# How many tracts are within each stationid? Shouldn't be too many
statbufftract22 %>%
  st_drop_geometry() %>%
  count(station_id) %>%
  count(n, name = "ntracts")


## How many stations are in the file?
statbufftract17 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  nrow()

### which stations aren't in the file anymore?
intersected <- statbufftract17 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  pull(station_id)

stations %>%
  st_drop_geometry() %>%
  filter(!station_id %in% intersected)

## How many census tracts are in the file?
statbufftract17 %>%
  st_drop_geometry() %>%
  distinct(geoid) %>%
  nrow()

glimpse(statbufftract17)

# How many tracts are within each stationid? Shouldn't be too many
statbufftract17 %>%
  st_drop_geometry() %>%
  count(station_id) %>%
  count(n, name = "ntracts")

## Create crosswalk between geoid and station_id that can be appended to tract[17/22]_2
tract22_xw <- statbufftract22 %>%
  st_drop_geometry() %>%
  group_by(station_id) %>%
  summarise(tract22_geoids = paste(geoid, collapse = " "))
  
tract17_xw <- statbufftract17 %>%
  st_drop_geometry() %>%
  group_by(station_id) %>%
  summarise(tract17_geoids = paste(geoid, collapse = " "))


## Add route flags to the block group data ----
tract22_flags <- statbufftract22 %>%
  st_drop_geometry() %>%
  # create list of flags for each geoid
  select(geoid, starts_with("flag")) %>%
  group_by(geoid) %>%
  # geoids are duplicated for different routes, keep all flags
  summarise(across(starts_with("flag"), ~max(.x, na.rm = T)))

tract22_3 <- tract22_2 %>%
  left_join(tract22_flags, by = "geoid") %>%
  # remove tract's with empty geometry
  filter(!st_is_empty(.)) %>%
  # replace NAs among flag vars that are outside the subway network
  mutate(across(starts_with("flag"), ~replace_na(.x, 0)))

tract17_flags <- statbufftract17 %>%
  st_drop_geometry() %>%
  # create list of flags for each geoid
  select(geoid, starts_with("flag")) %>%
  group_by(geoid) %>%
  # geoids are duplicated for different routes, keep all flags
  summarise(across(starts_with("flag"), ~max(.x, na.rm = T)))

tract17_3 <- tract17_2 %>%
  left_join(tract17_flags, by = "geoid") %>%
  # remove tract's with empty geometry
  filter(!st_is_empty(.)) %>%
  # replace NAs among flag vars that are outside the subway network
  mutate(across(starts_with("flag"), ~replace_na(.x, 0)))


# 4. Summarize to the station level -------------------------------------------

stat_sum22 <- statbufftract22 %>%
  st_drop_geometry() %>%
  group_by(station_id, stop_name) %>%
  summarise(pop22 = sum(pop, na.rm = TRUE),
            mhhi22 = weighted.mean(mhhi, nhh, na.rm = TRUE),
            nhh22 = sum(nhh, na.rm = TRUE),
            .groups = "keep") %>%
  ungroup()

stat_sum17 <- statbufftract17 %>%
  st_drop_geometry() %>%
  group_by(station_id) %>%
  summarise(pop17 = sum(pop, na.rm = TRUE),
            mhhi17 = weighted.mean(mhhi, nhh, na.rm = TRUE),
            nhh17 = sum(nhh, na.rm = TRUE),
            .groups = "keep") %>%
  ungroup()


## Check on merge using name var from both files
station_summary <- full_join(stat_sum22, stat_sum17, by = "station_id") %>%
  full_join(select(stations_sf,
                   station_id, daytime_routes, starts_with("flag"), georeference),
            by = "station_id") %>%
  left_join(tract22_xw, by = "station_id") %>%
  left_join(tract17_xw, by = "station_id") %>%
  # reassign as spatial data
  st_as_sf(crs = st_crs(2263)) %>% 
  # transform to web mercator for use in web mapping
  st_transform(st_crs(4326))


# 5. Line summary data --------------------------------------------------------

# Here, summary information for each subway line is collected and saved as a
#  dataset that can be queried in the web map for additional summary info.
#  Info will span population (people & hh's) and household income. More could
#  be added here at a later date to flesh out the story of who resides near each
#  subway line

# create list of subway lines to use in map functions
flagvars <- station_summary %>%
  st_drop_geometry() %>%
  select(starts_with("flag")) %>%
  names()

# create blank dataframe to add to
pop0 <- data.frame(pop_tot = c(0), var = c("test"))

# now conduct summary statistics across each subway line
pop <- flagvars %>%
  map(~ station_summary %>%
        st_drop_geometry() %>%
        filter(eval(as.name(paste(.x))) == 1) %>%
        summarise(pop_tot22 = sum(pop22, na.rm = TRUE),
                  pop_tot17 = sum(pop17, na.rm = TRUE)) %>%
        cbind(var = paste(.x))) %>%
  bind_rows(pop0, .) %>%
  filter(var != "test") %>%
  select(var, pop_tot22, pop_tot17)

# repeate for number of households
numhh0 <- data.frame(num_hh = c(0), var = c("test"))

numhh <- flagvars %>%
  map(~ station_summary %>%
        st_drop_geometry() %>%
        filter(eval(as.name(paste(.x))) == 1) %>%
        summarise(num_hh22 = sum(nhh22, na.rm = T),
                  num_hh17 = sum(nhh17, na.rm = T)) %>%
        cbind(var = paste(.x))) %>%
  bind_rows(numhh0, .) %>%
  filter(var != "test") %>%
  select(var, num_hh22, num_hh17)

# repeat for median hh income
mhhinc0 <- data.frame(mhhi = c(0), var = c("test"))

mhhinc <- flagvars %>%
  map(~ station_summary %>%
        st_drop_geometry() %>%
        filter(eval(as.name(paste(.x))) == 1) %>%
        summarise(mhhi22 = weighted.mean(mhhi22, nhh22, na.rm = TRUE),
                  mhhi17 = weighted.mean(mhhi17, nhh17, na.rm = TRUE)) %>%
        cbind(var = paste(.x))) %>%
  bind_rows(mhhinc0, .) %>%
  filter(var != "test") %>%
  select(var, mhhi22, mhhi17)

# join all 3 datasets together to create overall summary statistics for each line
line_summary <- full_join(pop, numhh, by = "var") %>%
  full_join(mhhinc, by = "var") %>%
  mutate(line = str_remove(var, "flag")) %>%
  select(line, contains("22"), contains("17"), var)

# add ranks for each of these 6 variables
line_summary2 <- line_summary %>% 
  mutate(across(pop_tot22:mhhi17, ~ rank(-.), .names = "rank_{.col}"))


# 6. Write permanent files ----------------------------------------------------

# summary demographic information for each subway station
st_write(station_summary, "dat/station_summary.geojson", delete_dsn = T)

# 2022 block group data (transform to web mercator for web mapping)
tract22_3 %>%
  st_transform(st_crs(4326)) %>%
  st_write("dat/tract22.geojson", delete_dsn = T)

# 2017 block group data
tract17_3 %>%
  st_transform(st_crs(4326)) %>%
  st_write("dat/tract17.geojson", delete_dsn = T)

# subway line summary info
write_csv(line_summary2, "dat/line_summary.csv")

