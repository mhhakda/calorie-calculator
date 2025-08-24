// Calorie Calculator JavaScript

// Global variables
let currentStep = 0;
const totalSteps = 11;
let userData = {};

// Activity multipliers
const activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    setupUnitToggles();
    setupFormValidation();
});

// Progress bar functionality
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const currentStepSpan = document.getElementById('currentStep');
    const progress = (currentStep / totalSteps) * 100;
    
    progressFill.style.width = progress + '%';
    currentStepSpan.textContent = Math.max(1, currentStep);
}

// Step navigation
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            hideStep(currentStep);
            currentStep++;
            showStep(currentStep);
            updateProgress();
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        hideStep(currentStep);
        currentStep--;
        showStep(currentStep);
        updateProgress();
    }
}

function hideStep(stepNumber) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (step) {
        step.classList.remove('active');
    }
}

function showStep(stepNumber) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (step) {
        step.classList.add('active');
    }
}

// Form validation
function validateCurrentStep() {
    clearErrorMessages();
    
    switch(currentStep) {
        case 1:
            return validateAge();
        case 2:
            return validateGender();
        case 3:
            return validateHeight();
        case 4:
            return validateWeight();
        case 5:
            return validateGoal();
        case 6:
            return validateActivity();
        case 7:
            return validateBodyFat();
        case 8:
            return validateWaist();
        case 9:
            return validateWorkType();
        case 10:
            return validateSleep();
        case 11:
            return validateStress();
        default:
            return true;
    }
}

function validateAge() {
    const age = document.getElementById('age').value;
    if (!age || age < 15 || age > 100) {
        showError('age-error', 'Please enter a valid age between 15 and 100');
        return false;
    }
    userData.age = parseInt(age);
    return true;
}

function validateGender() {
    const gender = document.querySelector('input[name="gender"]:checked');
    if (!gender) {
        showError('gender-error', 'Please select your gender');
        return false;
    }
    userData.gender = gender.value;
    return true;
}

function validateHeight() {
    const heightUnit = document.querySelector('.unit-btn.active[data-unit]').dataset.unit;
    userData.heightUnit = heightUnit;
    
    if (heightUnit === 'cm') {
        const heightCm = document.getElementById('height-cm').value;
        if (!heightCm || heightCm < 120 || heightCm > 250) {
            showError('height-error', 'Please enter a valid height between 120-250 cm');
            return false;
        }
        userData.heightCm = parseFloat(heightCm);
    } else {
        const heightFt = document.getElementById('height-ft').value;
        const heightIn = document.getElementById('height-in').value;
        if (!heightFt || heightFt < 3 || heightFt > 8 || !heightIn || heightIn < 0 || heightIn > 11) {
            showError('height-error', 'Please enter valid height (3-8 ft, 0-11 in)');
            return false;
        }
        userData.heightCm = (parseFloat(heightFt) * 12 + parseFloat(heightIn)) * 2.54;
    }
    return true;
}

function validateWeight() {
    const weightUnit = document.querySelector('#step-4 .unit-btn.active[data-unit]').dataset.unit;
    userData.weightUnit = weightUnit;
    
    if (weightUnit === 'kg') {
        const weightKg = document.getElementById('weight-kg').value;
        if (!weightKg || weightKg < 30 || weightKg > 300) {
            showError('weight-error', 'Please enter a valid weight between 30-300 kg');
            return false;
        }
        userData.weightKg = parseFloat(weightKg);
    } else {
        const weightLbs = document.getElementById('weight-lbs').value;
        if (!weightLbs || weightLbs < 66 || weightLbs > 660) {
            showError('weight-error', 'Please enter a valid weight between 66-660 lbs');
            return false;
        }
        userData.weightKg = parseFloat(weightLbs) * 0.453592;
    }
    return true;
}

function validateGoal() {
    const goal = document.querySelector('input[name="goal"]:checked');
    if (!goal) {
        showError('goal-error', 'Please select your goal');
        return false;
    }
    userData.goal = goal.value;
    return true;
}

function validateActivity() {
    const activity = document.querySelector('input[name="activity"]:checked');
    if (!activity) {
        showError('activity-error', 'Please select your activity level');
        return false;
    }
    userData.activity = activity.value;
    return true;
}

function validateBodyFat() {
    const bodyFat = document.getElementById('bodyfat').value;
    if (bodyFat && (bodyFat < 5 || bodyFat > 50)) {
        showError('bodyfat-error', 'Please enter a valid body fat percentage (5-50%)');
        return false;
    }
    userData.bodyFat = bodyFat ? parseFloat(bodyFat) : null;
    return true;
}

function validateWaist() {
    const waist = document.getElementById('waist').value;
    const unit = userData.heightUnit === 'cm' ? 'cm' : 'in';
    const minWaist = unit === 'cm' ? 50 : 20;
    const maxWaist = unit === 'cm' ? 200 : 79;
    
    if (!waist || waist < minWaist || waist > maxWaist) {
        showError('waist-error', `Please enter a valid waist measurement (${minWaist}-${maxWaist} ${unit})`);
        return false;
    }
    
    userData.waistMeasurement = parseFloat(waist);
    userData.waistUnit = unit;
    return true;
}

function validateWorkType() {
    const workType = document.querySelector('input[name="worktype"]:checked');
    if (!workType) {
        showError('worktype-error', 'Please select your work type');
        return false;
    }
    userData.workType = workType.value;
    return true;
}

function validateSleep() {
    const sleep = document.getElementById('sleep').value;
    if (!sleep || sleep < 4 || sleep > 12) {
        showError('sleep-error', 'Please enter valid sleep hours (4-12)');
        return false;
    }
    userData.sleep = parseFloat(sleep);
    return true;
}

function validateStress() {
    const stress = document.querySelector('input[name="stress"]:checked');
    if (!stress) {
        showError('stress-error', 'Please select your stress level');
        return false;
    }
    userData.stress = stress.value;
    return true;
}

// Error message handling
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.classList.remove('show');
        element.textContent = '';
    });
}

// Unit toggle functionality
function setupUnitToggles() {
    // Height unit toggle
    const heightUnitBtns = document.querySelectorAll('#step-3 .unit-btn');
    heightUnitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            heightUnitBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const unit = this.dataset.unit;
            const heightInputs = document.querySelectorAll('.height-inputs > div');
            heightInputs.forEach(input => input.classList.remove('active'));
            
            if (unit === 'cm') {
                document.querySelector('.height-cm').classList.add('active');
            } else {
                document.querySelector('.height-ft').classList.add('active');
            }
        });
    });
    
    // Weight unit toggle
    const weightUnitBtns = document.querySelectorAll('#step-4 .unit-btn');
    weightUnitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            weightUnitBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const unit = this.dataset.unit;
            const weightInputs = document.querySelectorAll('.weight-inputs > div');
            weightInputs.forEach(input => input.classList.remove('active'));
            
            if (unit === 'kg') {
                document.querySelector('.weight-kg').classList.add('active');
            } else {
                document.querySelector('.weight-lbs').classList.add('active');
            }
        });
    });
    
    // Update waist unit based on height unit
    const observer = new MutationObserver(function() {
        const heightUnit = document.querySelector('#step-3 .unit-btn.active')?.dataset.unit;
        const waistUnitLabel = document.getElementById('waist-unit');
        if (waistUnitLabel) {
            waistUnitLabel.textContent = heightUnit === 'cm' ? 'cm' : 'in';
        }
    });
    observer.observe(document.getElementById('step-3'), { subtree: true, attributes: true });
}

// Skip body fat functionality
function skipBodyFat() {
    userData.bodyFat = null;
    nextStep();
}

// Form validation setup
function setupFormValidation() {
    // Add real-time validation for numeric inputs
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    });
}

// Calculate results
function calculateResults() {
    if (!validateCurrentStep()) return;
    
    // Calculate BMR
    const bmr = calculateBMR();
    
    // Calculate TDEE
    const tdee = bmr * activityFactors[userData.activity];
    
    // Calculate goal calories
    const goalCalories = calculateGoalCalories(tdee);
    
    // Calculate macronutrients
    const macros = calculateMacronutrients(goalCalories);
    
    // Calculate health metrics
    const bmi = calculateBMI();
    const whr = calculateWaistToHeightRatio();
    
    // Generate recommendations
    const weightRecommendation = generateWeightRecommendation();
    const lifestyleTip = generateLifestyleTip();
    
    // Display results
    displayResults({
        maintenanceCalories: Math.round(tdee),
        goalCalories: Math.round(goalCalories),
        macros,
        bmi,
        whr,
        weightRecommendation,
        lifestyleTip
    });
}

// BMR calculation
function calculateBMR() {
    const { age, gender, weightKg, heightCm, bodyFat } = userData;
    
    if (bodyFat) {
        // Katch-McArdle formula
        const leanBodyMass = weightKg * (1 - bodyFat / 100);
        return 370 + (21.6 * leanBodyMass);
    } else {
        // Mifflin-St Jeor formula
        if (gender === 'male') {
            return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        } else {
            return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }
    }
}

// Goal calories calculation
function calculateGoalCalories(tdee) {
    const { goal } = userData;
    
    switch(goal) {
        case 'lose':
            return tdee - 400; // Safe deficit
        case 'gain':
            return tdee + 400; // Safe surplus
        default:
            return tdee; // Maintain
    }
}

// Macronutrient calculation
function calculateMacronutrients(calories) {
    const { weightKg, activity, goal } = userData;
    
    // Protein calculation (higher for active individuals and muscle gain)
    let proteinPerKg = 0.8;
    if (activity === 'very_active' || activity === 'super_active' || goal === 'gain') {
        proteinPerKg = 1.6;
    } else if (activity === 'moderately_active' || activity === 'lightly_active') {
        proteinPerKg = 1.2;
    }
    
    const proteinGrams = Math.round(weightKg * proteinPerKg);
    const proteinCalories = proteinGrams * 4;
    
    // Fat calculation (25% of total calories)
    const fatCalories = calories * 0.25;
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs calculation (remaining calories)
    const carbCalories = calories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);
    
    return {
        protein: {
            grams: proteinGrams,
            percent: Math.round((proteinCalories / calories) * 100)
        },
        fat: {
            grams: fatGrams,
            percent: 25
        },
        carbs: {
            grams: carbGrams,
            percent: Math.round((carbCalories / calories) * 100)
        }
    };
}

// BMI calculation
function calculateBMI() {
    const { weightKg, heightCm } = userData;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    
    let classification;
    if (bmi < 18.5) {
        classification = 'underweight';
    } else if (bmi < 25) {
        classification = 'normal';
    } else if (bmi < 30) {
        classification = 'overweight';
    } else {
        classification = 'obese';
    }
    
    return {
        value: bmi.toFixed(1),
        classification
    };
}

// Waist-to-Height Ratio calculation
function calculateWaistToHeightRatio() {
    const { waistMeasurement, waistUnit, heightCm } = userData;
    
    // Convert waist to cm if needed
    const waistCm = waistUnit === 'in' ? waistMeasurement * 2.54 : waistMeasurement;
    
    const ratio = waistCm / heightCm;
    
    let status;
    if (ratio < 0.5) {
        status = 'healthy';
    } else if (ratio < 0.6) {
        status = 'increased-risk';
    } else {
        status = 'high-risk';
    }
    
    return {
        value: ratio.toFixed(2),
        status
    };
}

// Weight recommendation
function generateWeightRecommendation() {
    const { goal } = userData;
    
    switch(goal) {
        case 'lose':
            return 'Aim to lose 0.5-1 kg (1-2 lbs) per week for safe, sustainable weight loss.';
        case 'gain':
            return 'Target 0.25-0.5 kg (0.5-1 lb) per week for healthy muscle gain.';
        default:
            return 'Focus on maintaining your current weight while building healthy habits.';
    }
}

// Lifestyle tip generation
function generateLifestyleTip() {
    const { sleep, stress, workType, activity } = userData;
    
    let tips = [];
    
    if (sleep < 7) {
        tips.push('Prioritize getting 7-9 hours of sleep per night for optimal metabolism and recovery.');
    }
    
    if (stress === 'high') {
        tips.push('Consider stress management techniques like meditation or yoga to support your health goals.');
    }
    
    if (workType === 'desk' && activity === 'sedentary') {
        tips.push('Take regular breaks to stand and move throughout your workday to boost metabolism.');
    }
    
    if (activity === 'sedentary') {
        tips.push('Start with 10-15 minutes of daily walking and gradually increase your activity level.');
    }
    
    if (tips.length === 0) {
        tips.push('Keep up the great work! Stay consistent with your nutrition and exercise routine.');
    }
    
    return tips[0]; // Return the first (most relevant) tip
}

// Display results
function displayResults(results) {
    // Hide form steps and show results
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('results').classList.remove('hidden');
    
    // Update calorie values
    document.getElementById('maintenance-calories').textContent = results.maintenanceCalories.toLocaleString();
    document.getElementById('goal-calories').textContent = results.goalCalories.toLocaleString();
    
    // Update goal label
    const goalLabels = {
        lose: 'For weight loss',
        gain: 'For muscle gain',
        maintain: 'To maintain weight'
    };
    document.getElementById('goal-label').textContent = goalLabels[userData.goal];
    
    // Update macronutrients
    document.getElementById('protein-grams').textContent = `${results.macros.protein.grams}g`;
    document.getElementById('protein-percent').textContent = `${results.macros.protein.percent}%`;
    document.getElementById('carbs-grams').textContent = `${results.macros.carbs.grams}g`;
    document.getElementById('carbs-percent').textContent = `${results.macros.carbs.percent}%`;
    document.getElementById('fat-grams').textContent = `${results.macros.fat.grams}g`;
    document.getElementById('fat-percent').textContent = `${results.macros.fat.percent}%`;
    
    // Update BMI
    document.getElementById('bmi-value').textContent = results.bmi.value;
    const bmiStatus = document.getElementById('bmi-status');
    bmiStatus.textContent = results.bmi.classification.charAt(0).toUpperCase() + results.bmi.classification.slice(1);
    bmiStatus.className = `result-status ${results.bmi.classification}`;
    
    // Update WHR
    document.getElementById('whr-value').textContent = results.whr.value;
    const whrStatus = document.getElementById('whr-status');
    const whrStatusText = {
        'healthy': 'Healthy',
        'increased-risk': 'Increased Risk',
        'high-risk': 'High Risk'
    };
    whrStatus.textContent = whrStatusText[results.whr.status];
    whrStatus.className = `result-status ${results.whr.status}`;
    
    // Update body fat display
    const bodyFatCard = document.querySelector('.body-fat-card');
    if (userData.bodyFat) {
        document.getElementById('bodyfat-display').textContent = `${userData.bodyFat}%`;
        bodyFatCard.classList.remove('hidden');
    } else {
        bodyFatCard.classList.add('hidden');
    }
    
    // Update recommendations
    document.getElementById('weight-recommendation').textContent = results.weightRecommendation;
    document.getElementById('lifestyle-tip').textContent = results.lifestyleTip;
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

    // ✅ Save results globally for PDF
    window.lastResults = {
        age: userData.age,
        gender: userData.gender,
        heightCm: userData.heightCm,
        weightKg: userData.weightKg,
        activity: userData.activity,
        goal: userData.goal,
        stress: userData.stress,
        bmr: results.bmr ? Math.round(results.bmr) : "—",
        tdee: results.maintenanceCalories,
        goalCalories: results.goalCalories,
        bmi: results.bmi.value,
        whtr: results.whr.value,
        macros: {
            proteinGrams: results.macros.protein.grams,
            proteinPct: results.macros.protein.percent,
            carbsGrams: results.macros.carbs.grams,
            carbsPct: results.macros.carbs.percent,
            fatGrams: results.macros.fat.grams,
            fatPct: results.macros.fat.percent
        }
    };

    // ✅ Enable PDF button
    document.getElementById("downloadResultsPdf").disabled = false;
}

// Reset calculator
function resetCalculator() {
    currentStep = 0;
    userData = {};
    
    // Clear all form inputs
    document.querySelectorAll('input').forEach(input => {
        if (input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    // Reset unit toggles
    document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.unit-btn[data-unit="cm"], .unit-btn[data-unit="kg"]').forEach(btn => btn.classList.add('active'));
    
    // Reset height/weight input visibility
    document.querySelectorAll('.height-inputs > div, .weight-inputs > div').forEach(div => div.classList.remove('active'));
    document.querySelector('.height-cm').classList.add('active');
    document.querySelector('.weight-kg').classList.add('active');
    
    // Hide results and show first step
    document.getElementById('results').classList.add('hidden');
    showStep(0);
    updateProgress();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ✅ Reset PDF button
    document.getElementById("downloadResultsPdf").disabled = true;
}
function downloadResults() {
    if (!window.lastResults) {
        alert("Please calculate results first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Function to build PDF (called after logo load OR fallback)
    function buildPDF(logoLoaded, img) {
        if (logoLoaded && img) {
            doc.addImage(img, "PNG", 150, 10, 40, 20);
        }

        // Title styled like site
        doc.setFontSize(20);
        doc.setTextColor(33, 150, 243);
        doc.text("Smart Calorie Calculator Results", 20, 20);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

        // Inputs
        let y = 45;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Your Inputs", 20, y); 
        y += 10;

        const inputs = [
          ["Age", window.lastResults.age],
          ["Gender", window.lastResults.gender],
          ["Height", window.lastResults.heightCm + " cm"],
          ["Weight", window.lastResults.weightKg + " kg"],
          ["Activity", window.lastResults.activity],
          ["Goal", window.lastResults.goal],
          ["Stress", window.lastResults.stress],
        ];
        doc.setFontSize(12);
        inputs.forEach(([label, value]) => {
          doc.text(`${label}: ${value ?? "—"}`, 20, y);
          y += 8;
        });

        // Results
        y += 10;
        doc.setFontSize(14);
        doc.text("Results", 20, y); 
        y += 10;

        const outputs = [
          ["BMR", window.lastResults.bmr + " kcal/day"],
          ["TDEE", window.lastResults.tdee + " kcal/day"],
          ["Goal Calories", window.lastResults.goalCalories + " kcal/day"],
          ["BMI", window.lastResults.bmi],
          ["WHtR", window.lastResults.whtr],
        ];
        doc.setFontSize(12);
        outputs.forEach(([label, value]) => {
          doc.text(`${label}: ${value ?? "—"}`, 20, y);
          y += 8;
        });

        // Macros
        y += 10;
        doc.setFontSize(14);
        doc.text("Macronutrient Breakdown", 20, y); 
        y += 10;
        doc.setFontSize(12);
        doc.text(`Protein: ${window.lastResults.macros.proteinGrams} g (${window.lastResults.macros.proteinPct}%)`, 20, y); y += 8;
        doc.text(`Carbs: ${window.lastResults.macros.carbsGrams} g (${window.lastResults.macros.carbsPct}%)`, 20, y); y += 8;
        doc.text(`Fat: ${window.lastResults.macros.fatGrams} g (${window.lastResults.macros.fatPct}%)`, 20, y); y += 8;

        // Links
        y += 15;
        doc.setTextColor(0, 102, 204);
        doc.textWithLink("👉 Try the Diet Planner", 20, y, { url: "https://thedietplanner.com/personalized-diet-plans" });
        y += 8;
        doc.textWithLink("👉 Use the Diet Tracker", 20, y, { url: "https://thedietplanner.com/diet-tracker" });

        // Footer
        y += 20;
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text("Disclaimer: This report is for informational purposes only and not medical advice.", 20, y);

        // Save PDF
        doc.save("calorie-results.pdf");
    }

    // Try loading logo, but don’t block PDF if it fails
    const img = new Image();
    img.crossOrigin = "Anonymous"; // helps avoid CORS issues
    img.src = "https://thedietplanner.com/logo.png"; // update with actual path
    img.onload = function () {
        buildPDF(true, img);
    };
    img.onerror = function () {
        buildPDF(false, null);
    };
}
// Utility functions for better UX
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && currentStep > 0 && currentStep <= totalSteps) {
        e.preventDefault();
        if (currentStep === totalSteps) {
            calculateResults();
        } else {
            nextStep();
        }
    }
});

// ✅ Attach click handler once
document.getElementById("downloadResultsPdf").addEventListener("click", downloadResults);
