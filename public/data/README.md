# CSV Allocation Data

This folder contains CSV files for loading non-optimized flight allocations directly from CSV files.

## File Naming Convention

Each CSV file represents one day of allocations and follows this naming pattern:

```
allocation_M1_YYYYMMDD.csv
```

Example: `allocation_M1_20250701.csv` contains allocations for July 1st, 2025.

## CSV Columns

| Column | Description |
|--------|-------------|
| MVMTNO | Movement/Flight number (unique identifier) |
| AIRL | Airline IATA code (e.g., ABY, QTR, KQA) |
| A/CTYPE | Aircraft type (e.g., A320, B738, A321) |
| STA | Scheduled Time of Arrival (YYYY-MM-DD HH:MM:SS) |
| STD | Scheduled Time of Departure (YYYY-MM-DD HH:MM:SS) |
| LOADTYPE | Load type (Pax, Cgo, etc.) |
| DESTN | Destination airport code |
| PAXIN | Number of arriving passengers |
| PAXOUT | Number of departing passengers |
| HIST_STAND | Historical/backup stand assignment |
| MODEL_STAND | **Primary stand assignment** (used for the timeline) |
| TYPE | Type of allocation (PREDAY, OPS, etc.) |

## Usage

1. Add your CSV files to this folder
2. In the app, click on the mode switcher in the header
3. Select "CSV" mode
4. Use the date picker to navigate to a date that matches a CSV file
5. The flights will be loaded from the CSV file

## Example

To load flights for July 15, 2025, create a file named:
```
allocation_M1_20250715.csv
```

Then select July 15, 2025 in the date picker while in CSV mode.
