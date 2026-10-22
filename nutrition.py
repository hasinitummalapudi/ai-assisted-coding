def estimate_nutrition(age, height_cm, weight_kg, activity='moderate'):
    height_m=height_cm/100
    bmi=round(weight_kg/(height_m*height_m),1)
    factors={'sedentary':1.2,'light':1.375,'moderate':1.55,'active':1.725}
    # Simplified neutral estimate for an educational demo, not a prescription.
    bmr=10*weight_kg+6.25*height_cm-5*age
    calories=round((bmr*factors.get(activity,1.55))/50)*50
    return {'bmi':bmi,'calorie_estimate':int(calories),'protein_estimate':int(round(weight_kg*0.8))}
