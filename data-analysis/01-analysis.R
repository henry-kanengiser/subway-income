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

bg22 <- get_acs(
  geography = "block group",
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

bg17 <- get_acs(
  geography = "block group",
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

lines <- c("1", "2", "3", "4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "S", "J", "L", "M", "N", "Q", "R", "W", "Z", "SIR")

stations2 <- lines %>%
  map(~ stations %>%
        mutate(.x = as.numeric(grepl(.x, daytime_routes, ignore.case=TRUE))) %>%
        select(.x) %>%
        set_names(paste0("flag", .x))) %>%
  bind_cols(stations, .) %>%
  # fix issue with R train capturing SIR stations too
  mutate(flagR = ifelse(flagSIR == 1, 0, flagR))

# check: number of rows in each flag should gut check match up with the world
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
  tm_polygons()


## 2b. Census data manipulation ----

# simplify datasets
## Note that the two datasets cannot be merged because they rely on different
##  geometries (2010 and 2020 block group borders)
bg22_2 <- bg22 %>%
  select(geoid, pop = popestimate, nhh = nhhestimate, mhhi = mhhiestimate, geometry) %>%
  st_transform(crs = st_crs(2263))

bg17_2 <- bg17 %>%
  select(geoid, pop = popestimate, nhh = nhhestimate, mhhi = mhhiestimate, geometry) %>%
  st_transform(crs = st_crs(2263))

# create centroid version of each file to intersect with the buffers
bg22_c <- st_centroid(bg22_2)
bg17_c <- st_centroid(bg17_2)


# 3. Link census data to subway stations --------------------------------------

# Intersect the station buffers layer with the 
statbuffbg22 <- stations_buffer %>%
  st_intersection(bg22_c)

statbuffbg17 <- stations_buffer %>%
  st_intersection(bg17_c)

### Checks on this intersection ----
## How many stations are in the file?
statbuffbg22 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  nrow()

### which stations aren't in the file anymore?
intersected <- statbuffbg22 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  pull(station_id)

stats3 %>%
  st_drop_geometry() %>%
  filter(!station_id %in% intersected)

## How many census bgs are in the file?
statbuffbg22 %>%
  st_drop_geometry() %>%
  distinct(geoid) %>%
  nrow()

glimpse(statbuffbg22)

# How many bgs are within each stationid? Shouldn't be too many
statbuffbg22 %>%
  st_drop_geometry() %>%
  count(station_id) %>%
  count(n, name = "nbgs")


## How many stations are in the file?
statbuffbg17 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  nrow()

### which stations aren't in the file anymore?
intersected <- statbuffbg17 %>%
  st_drop_geometry() %>%
  distinct(station_id) %>%
  pull(station_id)

stats3 %>%
  st_drop_geometry() %>%
  filter(!station_id %in% intersected)

## How many census bgs are in the file?
statbuffbg17 %>%
  st_drop_geometry() %>%
  distinct(geoid) %>%
  nrow()

glimpse(statbuffbg17)

# How many bgs are within each stationid? Shouldn't be too many
statbuffbg17 %>%
  st_drop_geometry() %>%
  count(station_id) %>%
  count(n, name = "nbgs")

# 4. Summarize to the station level -------------------------------------------

stat_sum22 <- statbuffbg22 %>%
  st_drop_geometry() %>%
  group_by(station_id, stop_name) %>%
  summarise(pop22 = sum(pop, na.rm = TRUE),
            mhhi22 = weighted.mean(mhhi, nhh, na.rm = TRUE),
            nhh22 = sum(nhh, na.rm = TRUE),
            .groups = "keep") %>%
  ungroup()

stat_sum17 <- statbuffbg22 %>%
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


# 6. Write permanent files ----------------------------------------------------

# summary demographic information for each subway station
st_write(station_summary, "dat/station_summary.geojson", delete.dsn = T)

# 2022 block group data
st_write(bg22_2, "dat/bg22.geojson", delete.dsn = T)

# 2017 block group data
st_write(bg17_2, "dat/bg17.geojson", delete.dsn = T)

# subway line summary info
write_csv(line_summary, "dat/line_summary.csv")
