from src.build_dataset import build_dataset
from src.train import train_model
from src.inference import run_inference

def main():

    build_dataset()

    train_model()

    run_inference()

if __name__ == "__main__":
    main()