# Better Blocks - Urban Planning Assistant

A web-based urban planning tool that uses NASA satellite data and OpenStreetMap to analyze infrastructure readiness and population distribution. Built for NASA Space Apps Challenge 2025.
About: https://youtu.be/7YuUUKEz9bA?si=I82Ki6zJBUpdODzy

## What it does

This app lets you draw any region on the map (currently optimized for Bangladesh) and instantly get:
- Real population data from NASA WorldPop 2020 satellite datasets
- Infrastructure count (hospitals, schools, police stations, fire stations, parks)
- Infrastructure readiness score (0-100 based on facility density)
- Population growth projections for 5 and 10 years

Basically you select an area and it tells you if that place is ready for the people living there or not.

## Why We built this

Urban planning in developing countries is a mess. City planners don't have easy access to real data about population and infrastructure. They rely on outdated census data or rough estimates which leads to poor decisions like building schools where there's already enough or putting hospitals too far from residential areas.

We wanted to make something that uses NASA's actual satellite data to give real numbers. Not estimates. Not guesses. Real data.

## Tech Stack

**Frontend:**
- React 18 with Vite
- Leaflet & react-leaflet for mapping
- Tailwind CSS for styling
- Lucide React for icons
- PapaParse for CSV parsing

**Data Sources:**
- NASA WorldPop Bangladesh 2020 (1km resolution population density)
- OpenStreetMap Overpass API (real-time infrastructure data)
- GHS Population 2030 projections (included but not integrated yet)

**Deployment:**
- Base version live on Vercel

## How it works

1. **User draws a region** - Simple rectangle drawing tool on the map
2. **Population calculation** - Fetches NASA WorldPop CSV data (180,815 grid cells for Bangladesh), filters coordinates within selected bounds, sums up actual population counts from satellite observations
3. **Infrastructure analysis** - Queries OpenStreetMap Overpass API for amenities (hospitals, clinics, pharmacies, police stations, fire stations, schools, parks)
4. **Readiness score** - Calculates infrastructure readiness based on ideal ratios (2 hospitals, 1 police, 1 fire, 5 schools per 10km²)
5. **Growth projections** - Applies 2.5% annual urban growth rate to project population for 5 and 10 years

All client-side. No backend needed because we're using public APIs and local CSV data.

## Features

### Real NASA Satellite Data
Not using math estimates anymore. The base version was using `area × 2500 people/km²` which is basically just math. Now it uses actual NASA WorldPop 2020 data at 1km resolution. The CSV file has X (longitude), Y (latitude), Z (population count) for every square kilometer of Bangladesh.

When you select a region, it parses 180K+ rows, filters by coordinates, and sums the real population. Then adjusts for years since 2020 using growth rate.

### OpenStreetMap Integration
Queries real infrastructure data using Overpass API. Counts:
- Healthcare: hospitals, clinics, doctors, pharmacies
- Safety: police stations, fire stations
- Education: schools
- Recreation: parks

Uses proper query syntax with node/way/relation searches and regex matching so it doesn't miss anything.

### Infrastructure Readiness Score
Compares actual facility count vs ideal density. Formula:
- Ideal ratios based on urban planning standards
- Normalized by area (accounts for large vs small regions)
- Weighted average across all facility types
- Result: 0-100 score (70+ = good, 40-70 = okay, <40 = needs work)

Tells you if a region is actually ready for its population or not.

## Data Sources Explained

### NASA WorldPop Bangladesh 2020
- **Source:** https://www.worldpop.org/
- **Resolution:** 1km grid cells
- **Format:** CSV with 180,815 rows (X, Y, Z coordinates)
- **Coverage:** All of Bangladesh
- **Use:** Real population counts instead of estimates

### GHS Population 2030 (Not integrated yet)
- **Source:** https://ghsl.jrc.ec.europa.eu/
- **Resolution:** 100m
- **Format:** GeoTIFF
- **Use:** Future population projections

### OpenStreetMap
- **API:** Overpass API
- **Use:** Real-time infrastructure queries
- **Data:** Hospitals, schools, police, fire, parks

## Limitations

### Base Version Constraints
- Only works for Bangladesh (that's where the NASA data covers)
- CSV parsing takes 2-5 seconds on first load (27MB file)
- Client-side processing (might be slow on older devices)

### Future Improvements
- Backend API for faster data processing
- GeoTIFF support for higher resolution data
- Global coverage with multiple country datasets
- Vector tiles for ultra-fast queries
- Cache mechanism for repeated regions
- Historical comparison (2015 vs 2020 vs projections)
- Export reports as PDF

## Why This Matters

Most urban planning tools cost thousands of dollars and require GIS expertise. This is free and works in any browser. 

City planners in developing countries can use this to make data-driven decisions. NGOs can identify underserved areas. Governments can plan infrastructure expansion based on actual population distribution.

And it uses NASA's satellite data which means it's not dependent on census data that might be years out of date or politically manipulated.

## Credits

- NASA WorldPop for population datasets
- OpenStreetMap contributors for infrastructure data
- Leaflet for mapping library
- The internet for free components (because why reinvent the wheel)

---

Built for NASA Space Apps Challenge 2025 By Hilsha HyperDrive🛰️