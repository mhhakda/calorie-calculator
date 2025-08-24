/*
QA CHECKLIST - Test these scenarios after changes:
1. Male, 30y, 175cm, 70kg, moderate activity → BMR ~1600-1700, TDEE ~2600-2700
2. Female, 25y, 160cm, 55kg, light activity → BMR ~1350-1400, TDEE ~1850-1900
3. ft/in and lbs conversions produce same results as cm/kg equivalents
4. Waist in inches and cm convert correctly for WHtR calculations
5. Body fat % input switches calculations to use Katch-McArdle formula
6. Copy JSON and Download PDF only enabled after successful calculation
*/

// Global variables
let currentStep = 0;
let userData = {};
let calculatedResults = {};
let resultsCalculated = false;

// Activity multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    super: 1.9
};

// BMI thresholds
const BMI_THRESHOLDS = {
    underweight: 18.5,
    normal: 24.9,
    overweight: 29.9
};

// Debug mode check
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

// DOM helper functions
function q(selector) {
    return document.querySelector(selector) || null;
}

function parseNumber(selector) {
    const el = q(selector);
    if (!el || !el.value) return null;
    const num = parseFloat(el.value);
    return isNaN(num) ? null : num;
}

function setText(selector, value) {
    const el = q(selector);
    if (el) el.textContent = value;
}

// Toast notification system
function showToast(message, type = 'info') {
    try {
        const container = q('#toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('toast--fade');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    } catch (error) {
        console.error('Toast error:', error);
    }
}

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data);
        const debugOutput = q('#debugOutput');
        if (debugOutput) {
            debugOutput.textContent += `${message}: ${JSON.stringify(data, null, 2)}\n`;
        }
    }
}

// Unit conversion helpers
function getHeightCm() {
    const activeUnit = q('#step-3 .unit-btn.active');
    if (!activeUnit) return null;
    
    if (activeUnit.dataset.unit === 'cm') {
        return parseNumber('#height-cm');
    } else {
        const ft = parseNumber('#height-ft') || 0;
        const inches = parseNumber('#height-in') || 0;
        if (ft === 0 && inches === 0) return null;
        return Math.round((ft * 12 + inches) * 2.54 * 100) / 100;
    }
}

function getWeightKg() {
    const activeUnit = q('#step-4 .unit-btn.active');
    if (!activeUnit) return null;
    
    if (activeUnit.dataset.unit === 'kg') {
        return parseNumber('#weight-kg');
    } else {
        const lbs = parseNumber('#weight-lbs');
        return lbs ? Math.round(lbs * 0.453592 * 100) / 100 : null;
    }
}

function getWaistCm() {
    const activeUnit = q('#step-8 .unit-btn.active');
    if (!activeUnit) return null;
    
    if (activeUnit.dataset.unit === 'cm') {
        return parseNumber('#waist-cm');
    } else {
        const inches = parseNumber('#waist-in');
        return inches ? Math.round(inches * 2.54 * 100) / 100 : null;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    try {
        updateProgress();
        setupUnitToggles();
        setupKeyboardNavigation();
        window.totalSteps = document.querySelectorAll('.form-step').length - 2; // Exclude welcome and results
        
        if (DEBUG_MODE) {
            const debugPanel = q('#debugPanel');
            if (debugPanel) debugPanel.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('App initialization failed', 'error');
    }
});

// Progress bar functionality
function updateProgress() {
    try {
        const totalSteps = Number(window.totalSteps || 11);
        const displayStep = Math.min(totalSteps, Math.max(1, currentStep));
        const progressPct = totalSteps > 1 ? Math.round(((currentStep - 1) / (totalSteps - 1)) * 100) : 0;
        
        const fill = q('#progressFill');
        if (fill) fill.style.width = Math.max(0, progressPct) + '%';
        
        setText('#currentStep', displayStep);
        setText('#totalSteps', totalSteps);
    } catch (error) {
        console.error('Progress update error:', error);
    }
}

// Step navigation
function nextStep() {
    try {
        if (validateCurrentStep()) {
            const totalSteps = Number(window.totalSteps || 11);
            if (currentStep < totalSteps) {
                hideStep(currentStep);
                currentStep++;
                showStep(currentStep);
                updateProgress();
            }
        }
    } catch (error) {
        console.error('Next step error:', error);
        showToast('Navigation error occurred', 'error');
    }
}

function prevStep() {
    try {
        if (currentStep > 0) {
            hideStep(currentStep);
            currentStep--;
            showStep(currentStep);
            updateProgress();
        }
    } catch (error) {
        console.error('Previous step error:', error);
        showToast('Navigation error occurred', 'error');
    }
}

function hideStep(stepNumber) {
    const step = q(`#step-${stepNumber}`);
    if (step) step.classList.remove('active');
}

function showStep(stepNumber) {
    const step = q(`#step-${stepNumber}`);
    if (step) step.classList.add('active');
    
    // Show results step
    if (stepNumber === 'results') {
        const resultsStep = q('#results');
        if (resultsStep) resultsStep.classList.add('active');
    }
}

// Form validation
function validateCurrentStep() {
    try {
        switch(currentStep) {
            case 1: return validateAge();
            case 2: return validateGender();
            case 3: return validateHeight();
            case 4: return validateWeight();
            case 5: return validateGoal();
            case 6: return validateActivity();
            case 7: return validateBodyFat();
            case 8: return validateWaist();
            case 9: return validateWork();
            case 10: return validateSleep();
            case 11: return validateStress();
            default: return true;
        }
    } catch (error) {
        console.error('Validation error:', error);
        showToast('Validation error occurred', 'error');
        return false;
    }
}

function validateAge() {
    const age = parseNumber('#age');
    if (!age || age < 1 || age > 120) {
        showToast('Please enter a valid age (1-120 years)', 'error');
        return false;
    }
    userData.age = age;
    return true;
}

function validateGender() {
    const genderEl = q('input[name="gender"]:checked');
    if (!genderEl) {
        showToast('Please select your gender', 'error');
        return false;
    }
    userData.gender = genderEl.value;
    return true;
}

function validateHeight() {
    const heightCm = getHeightCm();
    if (!heightCm || heightCm < 100 || heightCm > 250) {
        showToast('Please enter a valid height', 'error');
        return false;
    }
    userData.heightCm = heightCm;
    return true;
}

function validateWeight() {
    const weightKg = getWeightKg();
    if (!weightKg || weightKg < 20 || weightKg > 300) {
        showToast('Please enter a valid weight', 'error');
        return false;
    }
    userData.weightKg = weightKg;
    return true;
}

function validateGoal() {
    const goalEl = q('input[name="goal"]:checked');
    if (!goalEl) {
        showToast('Please select your goal', 'error');
        return false;
    }
    userData.goal = goalEl.value;
    return true;
}

function validateActivity() {
    const activityEl = q('input[name="activity"]:checked');
    if (!activityEl) {
        showToast('Please select your activity level', 'error');
        return false;
    }
    userData.activity = activityEl.value;
    return true;
}

function validateBodyFat() {
    const bodyFat = parseNumber('#bodyFat');
    if (bodyFat !== null) {
        if (bodyFat < 5 || bodyFat > 50) {
            showToast('Body fat percentage should be between 5% and 50%', 'error');
            return false;
        }
        userData.bodyFat = bodyFat;
    }
    return true;
}

function validateWaist() {
    const waistCm = getWaistCm();
    if (!waistCm || waistCm < 40 || waistCm > 200) {
        showToast('Please enter a valid waist measurement', 'error');
        return false;
    }
    userData.waistCm = waistCm;
    return true;
}

function validateWork() {
    const workEl = q('input[name="work"]:checked');
    if (!workEl) {
        showToast('Please select your work type', 'error');
        return false;
    }
    userData.work = workEl.value;
    return true;
}

function validateSleep() {
    const sleep = parseNumber('#sleep');
    if (!sleep || sleep < 3 || sleep > 15) {
        showToast('Please enter sleep hours between 3 and 15', 'error');
        return false;
    }
    userData.sleep = sleep;
    return true;
}

function validateStress() {
    const stressEl = q('input[name="stress"]:checked');
    if (!stressEl) {
        showToast('Please select your stress level', 'error');
        return false;
    }
    userData.stress = stressEl.value;
    return true;
}

// Unit toggle functionality
function setupUnitToggles() {
    try {
        // Setup waist unit conversion
        const waistCmInput = q('#waist-cm');
        const waistInInput = q('#waist-in');
        
        if (waistCmInput) {
            waistCmInput.addEventListener('input', () => {
                const cm = parseFloat(waistCmInput.value);
                if (!isNaN(cm) && waistInInput) {
                    waistInInput.value = Math.round((cm / 2.54) * 10) / 10;
                }
            });
        }
        
        if (waistInInput) {
            waistInInput.addEventListener('input', () => {
                const inches = parseFloat(waistInInput.value);
                if (!isNaN(inches) && waistCmInput) {
                    waistCmInput.value = Math.round((inches * 2.54) * 10) / 10;
                }
            });
        }
    } catch (error) {
        console.error('Unit toggle setup error:', error);
    }
}

function toggleHeightUnit(clickedBtn) {
    try {
        const buttons = document.querySelectorAll('#step-3 .unit-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        clickedBtn.classList.add('active');
        clickedBtn.setAttribute('aria-checked', 'true');
        
        const unit = clickedBtn.dataset.unit;
        const cmGroup = q('#height-cm-group');
        const ftGroup = q('#height-ft-group');
        
        if (unit === 'cm') {
            if (cmGroup) cmGroup.classList.remove('hidden');
            if (ftGroup) ftGroup.classList.add('hidden');
        } else {
            if (cmGroup) cmGroup.classList.add('hidden');
            if (ftGroup) ftGroup.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Height toggle error:', error);
    }
}

function toggleWeightUnit(clickedBtn) {
    try {
        const buttons = document.querySelectorAll('#step-4 .unit-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        clickedBtn.classList.add('active');
        clickedBtn.setAttribute('aria-checked', 'true');
        
        const unit = clickedBtn.dataset.unit;
        const kgGroup = q('#weight-kg-group');
        const lbsGroup = q('#weight-lbs-group');
        
        if (unit === 'kg') {
            if (kgGroup) kgGroup.classList.remove('hidden');
            if (lbsGroup) lbsGroup.classList.add('hidden');
        } else {
            if (kgGroup) kgGroup.classList.add('hidden');
            if (lbsGroup) lbsGroup.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Weight toggle error:', error);
    }
}

function toggleWaistUnit(clickedBtn) {
    try {
        const buttons = document.querySelectorAll('#step-8 .unit-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        clickedBtn.classList.add('active');
        clickedBtn.setAttribute('aria-checked', 'true');
        
        const unit = clickedBtn.dataset.unit;
        const cmGroup = q('#waist-cm-group');
        const inGroup = q('#waist-in-group');
        
        if (unit === 'cm') {
            if (cmGroup) cmGroup.classList.remove('hidden');
            if (inGroup) inGroup.classList.add('hidden');
        } else {
            if (cmGroup) cmGroup.classList.add('hidden');
            if (inGroup) inGroup.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Waist toggle error:', error);
    }
}

function setupKeyboardNavigation() {
    try {
        // Add keyboard support for unit toggles
        const unitButtons = document.querySelectorAll('.unit-btn');
        unitButtons.forEach(btn => {
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
        
        // Add keyboard support for radio groups
        const radioGroups = document.querySelectorAll('[role="radiogroup"]');
        radioGroups.forEach(group => {
            const radios = group.querySelectorAll('input[type="radio"]');
            radios.forEach((radio, index) => {
                radio.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const next = radios[(index + 1) % radios.length];
                        next.focus();
                        next.checked = true;
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const prev = radios[(index - 1 + radios.length) % radios.length];
                        prev.focus();
                        prev.checked = true;
                    }
                });
            });
        });
    } catch (error) {
        console.error('Keyboard navigation setup error:', error);
    }
}

function skipBodyFat() {
    userData.bodyFat = null;
    nextStep();
}

// Main calculation function - FIXED to ensure it runs
function calculateResults() {
    try {
        debugLog('Starting calculation with userData', userData);
        
        // Validate all required data first
        if (!userData.age || !userData.gender || !userData.heightCm || !userData.weightKg || 
            !userData.goal || !userData.activity || !userData.waistCm || !userData.work || 
            !userData.sleep || !userData.stress) {
            
            const missingFields = [];
            if (!userData.age) missingFields.push('Age (Step 1)');
            if (!userData.gender) missingFields.push('Gender (Step 2)');
            if (!userData.heightCm) missingFields.push('Height (Step 3)');
            if (!userData.weightKg) missingFields.push('Weight (Step 4)');
            if (!userData.goal) missingFields.push('Goal (Step 5)');
            if (!userData.activity) missingFields.push('Activity (Step 6)');
            if (!userData.waistCm) missingFields.push('Waist (Step 8)');
            if (!userData.work) missingFields.push('Work Type (Step 9)');
            if (!userData.sleep) missingFields.push('Sleep (Step 10)');
            if (!userData.stress) missingFields.push('Stress (Step 11)');
            
            showToast(`Please complete: ${missingFields.join(', ')}`, 'error');
            return false;
        }
        
        // Calculate BMR using appropriate formula
        const bmr = calculateBMR();
        debugLog('BMR calculated', bmr);
        
        if (!bmr || bmr < 800 || bmr > 4000) {
            throw new Error('Invalid BMR calculation result');
        }
        
        // Calculate TDEE
        const multiplier = ACTIVITY_MULTIPLIERS[userData.activity] || 1.2;
        const tdee = bmr * multiplier;
        debugLog('TDEE calculated', { bmr, multiplier, tdee });
        
        // Calculate goal calories with safety floor
        let goalCalories = calculateGoalCalories(tdee);
        if (goalCalories < 1000) {
            showToast('Warning: Very low calorie target detected. Using 1000 kcal minimum.', 'warning');
            goalCalories = Math.max(goalCalories, 1000);
        }
        
        // Calculate BMI
        const bmi = calculateBMI();
        debugLog('BMI calculated', bmi);
        
        // Calculate waist-to-height ratio
        const waistToHeight = calculateWaistToHeight();
        debugLog('Waist-to-height ratio', waistToHeight);
        
        // Calculate macros only if calories > 0
        const macros = goalCalories > 0 ? calculateMacros(goalCalories) : {
            protein: { grams: 0, calories: 0, percentage: 0 },
            carbs: { grams: 0, calories: 0, percentage: 0 },
            fats: { grams: 0, calories: 0, percentage: 0 }
        };
        debugLog('Macros calculated', macros);
        
        // Store results
        calculatedResults = {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            goalCalories: Math.round(goalCalories),
            bmi: Math.round(bmi * 100) / 100,
            waistToHeight: Math.round(waistToHeight * 1000) / 1000,
            macros,
            userData: { ...userData }
        };
        
        debugLog('Final results', calculatedResults);
        resultsCalculated = true;
        
        // Enable export buttons
        const copyBtn = q('#copyResultsBtn');
        const pdfBtn = q('#downloadPdfBtn');
        if (copyBtn) copyBtn.disabled = false;
        if (pdfBtn) pdfBtn.disabled = false;
        
        // Display results
        displayResults();
        
        // Navigate to results
        hideStep(currentStep);
        showStep('results');
        
        showToast('Calculation completed successfully!', 'success');
        return true;
        
    } catch (error) {
        console.error('Calculation error:', error);
        showToast('Calculation failed — check console', 'error');
        return false;
    }
}

function calculateBMR() {
    const { age, gender, weightKg, heightCm, bodyFat } = userData;
    
    // Use Katch-McArdle if body fat is available
    if (bodyFat && bodyFat > 0) {
        const leanMass = weightKg * (1 - bodyFat / 100);
        return 370 + (21.6 * leanMass);
    }
    
    // Use Mifflin-St Jeor formula by default
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    
    if (gender === 'male') {
        bmr += 5;
    } else if (gender === 'female') {
        bmr -= 161;
    } else {
        bmr -= 78; // Average adjustment for other
    }
    
    return bmr;
}

function calculateGoalCalories(tdee) {
    const { goal } = userData;
    
    switch(goal) {
        case 'lose':
            return tdee - 500; // 1 lb per week loss
        case 'maintain':
            return tdee;
        case 'gain':
            return tdee + 300; // Conservative gain
        default:
            return tdee;
    }
}

function calculateBMI() {
    const { weightKg, heightCm } = userData;
    const heightInMeters = heightCm / 100;
    return heightInMeters > 0 ? weightKg / (heightInMeters * heightInMeters) : 0;
}

function calculateWaistToHeight() {
    const { waistCm, heightCm } = userData;
    return heightCm > 0 ? waistCm / heightCm : 0;
}

function calculateMacros(goalCalories) {
    if (goalCalories <= 0) {
        return {
            protein: { grams: 0, calories: 0, percentage: 0 },
            carbs: { grams: 0, calories: 0, percentage: 0 },
            fats: { grams: 0, calories: 0, percentage: 0 }
        };
    }
    
    const { weightKg, goal, activity } = userData;
    
    // Protein calculation (1.2-2.0g per kg based on activity and goal)
    let proteinPerKg = 1.2;
    if (goal === 'gain') proteinPerKg = 1.8;
    else if (activity === 'active' || activity === 'super') proteinPerKg = 1.6;
    
    const proteinGrams = Math.round(weightKg * proteinPerKg);
    const proteinCalories = proteinGrams * 4;
    
    // Fat calculation (25% of calories)
    const fatCalories = Math.round(goalCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs get the rest
    const carbsCalories = Math.max(0, goalCalories - proteinCalories - fatCalories);
    const carbsGrams = Math.round(carbsCalories / 4);
    
    // Calculate percentages with division-by-zero guard
    const totalCalories = proteinCalories + fatCalories + carbsCalories;
    const proteinPct = totalCalories > 0 ? Math.round((proteinCalories / totalCalories) * 100) : 0;
    const fatPct = totalCalories > 0 ? Math.round((fatCalories / totalCalories) * 100) : 0;
    const carbsPct = totalCalories > 0 ? Math.round((carbsCalories / totalCalories) * 100) : 0;
    
    return {
        protein: { grams: proteinGrams, calories: proteinCalories, percentage: proteinPct },
        carbs: { grams: carbsGrams, calories: carbsCalories, percentage: carbsPct },
        fats: { grams: fatGrams, calories: fatCalories, percentage: fatPct }
    };
}

function displayResults() {
    try {
        const { bmr, tdee, goalCalories, bmi, waistToHeight, macros } = calculatedResults;
        
        // Display main metrics
        setText('#maintenanceCalories', tdee.toLocaleString());
        setText('#goalCalories', goalCalories.toLocaleString());
        setText('#bmi', bmi.toFixed(1));
        setText('#waistToHeight', waistToHeight.toFixed(3));
        
        // BMI Category
        let bmiCategory = 'Normal';
        if (bmi < BMI_THRESHOLDS.underweight) bmiCategory = 'Underweight';
        else if (bmi > BMI_THRESHOLDS.overweight) bmiCategory = 'Obese';
        else if (bmi > BMI_THRESHOLDS.normal) bmiCategory = 'Overweight';
        setText('#bmiCategory', bmiCategory);
        
        // Waist Category
        let waistCategory = 'Low Risk';
        if (waistToHeight >= 0.6) waistCategory = 'High Risk';
        else if (waistToHeight >= 0.5) waistCategory = 'Increased Risk';
        setText('#waistCategory', waistCategory);
        
        // Goal Label
        const goalLabels = {
            lose: 'For weight loss',
            maintain: 'To maintain weight',
            gain: 'For muscle gain'
        };
        setText('#goalLabel', goalLabels[userData.goal] || 'For your goal');
        
        // Macronutrients
        displayMacros(macros);
        
        // Recommendations
        displayRecommendations();
        
    } catch (error) {
        console.error('Display results error:', error);
        showToast('Error displaying results', 'error');
    }
}

function displayMacros(macros) {
    try {
        // Protein
        setText('#proteinAmount', `${macros.protein.grams}g (${macros.protein.percentage}%)`);
        const proteinBar = q('#proteinBar');
        if (proteinBar) proteinBar.style.width = `${macros.protein.percentage}%`;
        
        // Carbs
        setText('#carbsAmount', `${macros.carbs.grams}g (${macros.carbs.percentage}%)`);
        const carbsBar = q('#carbsBar');
        if (carbsBar) carbsBar.style.width = `${macros.carbs.percentage}%`;
        
        // Fats
        setText('#fatsAmount', `${macros.fats.grams}g (${macros.fats.percentage}%)`);
        const fatsBar = q('#fatsBar');
        if (fatsBar) fatsBar.style.width = `${macros.fats.percentage}%`;
    } catch (error) {
        console.error('Macro display error:', error);
    }
}

function displayRecommendations() {
    try {
        const { goal, sleep, stress, work, bodyFat } = userData;
        
        // Weekly goal
        const goals = {
            lose: 'Safe weekly weight loss: 0.5-1.0 kg (1-2 lbs)',
            maintain: 'Focus on maintaining current weight with balanced nutrition',
            gain: 'Safe weekly weight gain: 0.25-0.5 kg (0.5-1 lbs)'
        };
        setText('#weeklyGoal', `Weekly Target: ${goals[goal]}`);
        
        // Lifestyle tip
        let tip = 'Stay consistent with your nutrition and exercise routine.';
        if (sleep < 7) {
            tip = 'Consider getting more sleep (7-9 hours) to support your metabolism and recovery.';
        } else if (stress === 'high') {
            tip = 'High stress can affect your metabolism. Consider stress management techniques.';
        } else if (work === 'desk') {
            tip = 'With a desk job, try to add more movement throughout your day.';
        }
        setText('#lifestyleTip', `Lifestyle Tip: ${tip}`);
        
        // Body fat display
        if (bodyFat) {
            setText('#bodyFatDisplay', `Body Fat: ${bodyFat}% (used for more accurate BMR calculation)`);
        } else {
            setText('#bodyFatDisplay', '');
        }
    } catch (error) {
        console.error('Recommendations display error:', error);
    }
}

// Export functions
function copyResultsJSON() {
    try {
        if (!resultsCalculated) {
            showToast('Calculate results first', 'warning');
            return;
        }
        
        const jsonData = JSON.stringify(calculatedResults, null, 2);
        navigator.clipboard.writeText(jsonData).then(() => {
            showToast('Results copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy to clipboard', 'error');
        });
    } catch (error) {
        console.error('Copy JSON error:', error);
        showToast('Copy failed', 'error');
    }
}

function downloadResultsPDF() {
    try {
        if (!resultsCalculated) {
            showToast('Calculate results first', 'warning');
            return;
        }
        
        if (typeof window.jsPDF === 'undefined') {
            showToast('PDF library not loaded', 'error');
            return;
        }
        
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text('Calorie Calculator Results', 20, 30);
        
        // User info
        doc.setFontSize(12);
        let y = 50;
        doc.text(`Age: ${userData.age} years`, 20, y);
        y += 10;
        doc.text(`Gender: ${userData.gender}`, 20, y);
        y += 10;
        doc.text(`Height: ${userData.heightCm.toFixed(0)}cm`, 20, y);
        y += 10;
        doc.text(`Weight: ${userData.weightKg.toFixed(1)}kg`, 20, y);
        y += 10;
        doc.text(`Goal: ${userData.goal}`, 20, y);
        y += 10;
        doc.text(`Activity: ${userData.activity}`, 20, y);
        
        // Results
        y += 20;
        doc.setFontSize(14);
        doc.text('Calculated Results:', 20, y);
        y += 15;
        doc.setFontSize(12);
        doc.text(`BMR (Base Metabolic Rate): ${calculatedResults.bmr} calories`, 20, y);
        y += 10;
        doc.text(`TDEE (Total Daily Energy): ${calculatedResults.tdee} calories`, 20, y);
        y += 10;
        doc.text(`Goal Calories: ${calculatedResults.goalCalories} calories`, 20, y);
        y += 10;
        doc.text(`BMI: ${calculatedResults.bmi}`, 20, y);
        y += 10;
        doc.text(`Waist-to-Height Ratio: ${calculatedResults.waistToHeight}`, 20, y);
        
        // Macros
        y += 20;
        doc.setFontSize(14);
        doc.text('Macronutrient Breakdown:', 20, y);
        y += 15;
        doc.setFontSize(12);
        doc.text(`Protein: ${calculatedResults.macros.protein.grams}g (${calculatedResults.macros.protein.percentage}%)`, 20, y);
        y += 10;
        doc.text(`Carbohydrates: ${calculatedResults.macros.carbs.grams}g (${calculatedResults.macros.carbs.percentage}%)`, 20, y);
        y += 10;
        doc.text(`Fats: ${calculatedResults.macros.fats.grams}g (${calculatedResults.macros.fats.percentage}%)`, 20, y);
        
        doc.save('calorie-calculator-results.pdf');
        showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF download error:', error);
        showToast('PDF download failed', 'error');
    }
}

function startOver() {
    try {
        currentStep = 0;
        userData = {};
        calculatedResults = {};
        resultsCalculated = false;
        
        // Reset all form inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Reset unit toggles
        const unitBtns = document.querySelectorAll('.unit-btn');
        unitBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        // Activate first unit buttons
        const firstHeightBtn = q('#step-3 .unit-btn[data-unit="cm"]');
        const firstWeightBtn = q('#step-4 .unit-btn[data-unit="kg"]');
        const firstWaistBtn = q('#step-8 .unit-btn[data-unit="cm"]');
        
        if (firstHeightBtn) {
            firstHeightBtn.classList.add('active');
            firstHeightBtn.setAttribute('aria-checked', 'true');
        }
        if (firstWeightBtn) {
            firstWeightBtn.classList.add('active');
            firstWeightBtn.setAttribute('aria-checked', 'true');
        }
        if (firstWaistBtn) {
            firstWaistBtn.classList.add('active');
            firstWaistBtn.setAttribute('aria-checked', 'true');
        }
        
        // Disable export buttons
        const copyBtn = q('#copyResultsBtn');
        const pdfBtn = q('#downloadPdfBtn');
        if (copyBtn) copyBtn.disabled = true;
        if (pdfBtn) pdfBtn.disabled = true;
        
        // Hide all steps and show welcome
        const steps = document.querySelectorAll('.form-step');
        steps.forEach(step => step.classList.remove('active'));
        
        const welcomeStep = q('#step-0');
        if (welcomeStep) welcomeStep.classList.add('active');
        
        updateProgress();
        showToast('Calculator reset successfully', 'success');
    } catch (error) {
        console.error('Start over error:', error);
        showToast('Reset failed', 'error');
    }
}
