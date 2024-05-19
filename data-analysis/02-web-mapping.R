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
stations <- st_read("dat/station_summary.geojson")

#census block group data
bg22 <- st_read("dat/bg22.geojson")
bg17 <- st_read("dat/bg17.geojson")


# subway line summary info
write_csv(line_summary, "dat/line_summary.csv")
