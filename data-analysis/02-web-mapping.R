### subway-income project ###

######## 2. Web Mapping Prep ########

# The PURPOSE of this script is to prepare the files developed in the previous
# script for being placed into a MapBox GL JS website. 



# 0. Packages ----
library(tidyverse)
library(sf)
library(janitor)
library(tidycensus)
library(tmap)

#prepare for interactive mapping
tmap_mode("view")
