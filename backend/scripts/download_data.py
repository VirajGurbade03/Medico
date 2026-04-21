import os
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def setup_data_directory():
    """Creates the data directory if it doesn't exist."""
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "data" / "mimic3"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir

def download_dataset(output_dir: Path):
    """Downloads the MIMIC-III sepsis dataset using the Kaggle API."""
    dataset_name = "asjad99/mimiciii"
    logger.info(f"Downloading dataset {dataset_name} to {output_dir}...")
    
    try:
        # Run the kaggle api command
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", dataset_name, "-p", str(output_dir), "--unzip"],
            check=True
        )
        logger.info("✅ Dataset downloaded and extracted successfully.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to download dataset: {e}")
        logger.error("Please ensure you have configured your kaggle.json file properly.")
    except FileNotFoundError:
        logger.error("Kaggle CLI not found. Please ensure the 'kaggle' package is installed.")

if __name__ == "__main__":
    logger.info("Starting MIMIC-III data download...")
    data_folder = setup_data_directory()
    download_dataset(data_folder)
