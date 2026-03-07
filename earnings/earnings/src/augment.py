import pandas as pd
import numpy as np

def augment_data(df, factor=5):

    frames = [df]

    for _ in range(factor):

        temp = df.copy()

        temp["current_velocity"] = temp["current_velocity"] * (1 + np.random.normal(0,0.05,len(temp)))

        temp["trip_rate"] = temp["trip_rate"] * (1 + np.random.normal(0,0.05,len(temp)))

        temp["cumulative_earnings"] = temp["cumulative_earnings"] + np.random.normal(0,5,len(temp))

        frames.append(temp)

    df_aug = pd.concat(frames)

    df_aug = df_aug.sample(frac=1).reset_index(drop=True)

    return df_aug