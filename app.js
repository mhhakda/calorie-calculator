/*
QA CHECKLIST - Test these scenarios after changes:
1. Male, 30y, 175cm, 70kg, moderate activity → BMR ~1700, TDEE ~2600-2700
2. Female, 25y, 160cm, 55kg, light activity → BMR ~1350, TDEE ~1850-1900  
3. Outlier inputs: age 14, weight 15kg → should show confirmation modal
4. Progress bar: should show 1/11, 2/11... 11/11, fill from 0% to 100%
5. Keyboard navigation: tab through buttons, arrow keys on unit toggles
6. Export functions: Copy JSON works, PDF downloads with user data
*/

// CONFIG / TUNABLES
const BMR_FORMULA = 'mifflin-st-jeor'; // allowed: 'mifflin-st-jeor' | 'harris-benedict'
const ACTIVITY_MULTIPLIERS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, super: 1.9 };
const BMI_THRESHOLDS = { underweight: 18.5, normal: 24.9, overweight: 29.9 };
const MACRO_DEFAULTS = { proteinPct: 25, carbsPct: 50, fatPct: 25 };

// Global variables
let currentStep = 0;
let userData = {};
let calculatedResults = {};

// Safe DOM helpers
function q(sel) { return document.querySelector(sel) || null; }
function qa(sel) { return document.querySelectorAll(sel) || []; }
function safeText(sel, fallback='') { const el=q(sel); return el ? (el.textContent || el.value || fallback) : fallback; }
function safeValue(sel, fallback='') { const el=q(sel); return el && el.value !== undefined ? el.value : fallback; }

// Toast notification system
function showToast(msg, type='info') {
    try {
        const container = q('#toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = msg;
        
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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    try {
        updateProgress();
        setupUnitToggles();
        setupKeyboardNavigation();
        window.totalSteps = qa('.form-step').length - 1; // Exclude welcome screen
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('App initialization failed', 'error');
    }
});

// Progress bar functionality - FIXED
function updateProgress() {
    try {
        const totalSteps = Number(window.totalSteps || 11);
        const displayStep = Math.min(totalSteps, currentStep + 1);
        const progressPct = totalSteps > 1 ? Math.round((currentStep / (totalSteps - 1)) * 100) : 100;
        
        const fill = q('#progressFill');
        if (fill) fill.style.width = progressPct + '%';
        
        const stepLabel = q('#currentStep');
        if (stepLabel) stepLabel.textContent = displayStep;
        
        const totalLabel = q('#totalSteps');
        if (totalLabel) totalLabel.textContent = totalSteps;
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
}

// Modal functionality
let pendingStepAdvance = false;

function showConfirmModal(title, message) {
    const modal = q('#modal');
    const titleEl = q('#modal-title');
    const messageEl = q('#modal-message');
    
    if (modal && titleEl && messageEl) {
        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeModal() {
    const modal = q('#modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    pendingStepAdvance = false;
}

function confirmModal() {
    closeModal();
    if (pendingStepAdvance) {
        pendingStepAdvance = false;
        // Force advance to next step
        hideStep(currentStep);
        currentStep++;
        showStep(currentStep);
        updateProgress();
    }
}

// Form validation with outlier handling
function validateCurrentStep() {
    try {
        clearErrorMessages();
        
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
    const ageEl = q('#age');
    if (!ageEl) return false;
    
    const age = Number(ageEl.value);
    if (!age || age < 1) {
        showToast('Please enter a valid age', 'error');
        return false;
    }
    
    // Outlier handling with confirmation
    if (age < 15 || age > 100) {
        showConfirmModal('Unusual Age', `You've entered age ${age}. This is outside typical ranges. Proceed anyway?`);
        pendingStepAdvance = true;
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
    const activeUnit = q('.unit-btn[data-unit].active');
    if (!activeUnit) return false;
    
    const unit = activeUnit.dataset.unit;
    
    if (unit === 'cm') {
        const heightEl = q('#height-cm');
        if (!heightEl) return false;
        
        const height = Number(heightEl.value);
        if (!height || height < 50) {
            showToast('Please enter a valid height', 'error');
            return false;
        }
        
        if (height < 100 || height > 250) {
            showConfirmModal('Unusual Height', `You've entered ${height}cm. This is outside typical ranges. Proceed anyway?`);
            pendingStepAdvance = true;
            return false;
        }
        
        userData.height = height;
        userData.heightUnit = 'cm';
    } else {
        const ftEl = q('#height-ft');
        const inEl = q('#height-in');
        if (!ftEl || !inEl) return false;
        
        const ft = Number(ftEl.value) || 0;
        const inches = Number(inEl.value) || 0;
        
        if (ft < 3 || ft > 8 || inches < 0 || inches > 11) {
            showToast('Please enter valid height values', 'error');
            return false;
        }
        
        const totalCm = (ft * 12 + inches) * 2.54;
        userData.height = totalCm;
        userData.heightUnit = 'ft';
        userData.heightFt = ft;
        userData.heightIn = inches;
    }
    
    return true;
}

function validateWeight() {
    const activeUnit = q('.unit-btn[data-unit].active');
    if (!activeUnit) return false;
    
    const unit = activeUnit.dataset.unit;
    let weight;
    
    if (unit === 'kg') {
        const weightEl = q('#weight-kg');
        if (!weightEl) return false;
        
        weight = Number(weightEl.value);
        if (!weight || weight < 10) {
            showToast('Please enter a valid weight', 'error');
            return false;
        }
        
        if (weight < 20 || weight > 300) {
            showConfirmModal('Unusual Weight', `You've entered ${weight}kg. This is outside typical ranges. Proceed anyway?`);
            pendingStepAdvance = true;
            return false;
        }
        
        userData.weight = weight;
        userData.weightUnit = 'kg';
    } else {
        const weightEl = q('#weight-lbs');
        if (!weightEl) return false;
        
        const lbs = Number(weightEl.value);
        if (!lbs || lbs < 20) {
            showToast('Please enter a valid weight', 'error');
            return false;
        }
        
        if (lbs < 44 || lbs > 660) {
            showConfirmModal('Unusual Weight', `You've entered ${lbs}lbs. This is outside typical ranges. Proceed anyway?`);
            pendingStepAdvance = true;
            return false;
        }
        
        weight = lbs * 0.453592;
        userData.weight = weight;
        userData.weightUnit = 'lbs';
        userData.weightLbs = lbs;
    }
    
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
    const bodyFatEl = q('#bodyFat');
    if (bodyFatEl && bodyFatEl.value) {
        const bodyFat = Number(bodyFatEl.value);
        if (bodyFat < 5 || bodyFat > 50) {
            showToast('Body fat percentage should be between 5% and 50%', 'error');
            return false;
        }
        userData.bodyFat = bodyFat;
    }
    return true;
}

function validateWaist() {
    const waistEl = q('#waist');
    if (!waistEl) return false;
    
    const waist = Number(waistEl.value);
    if (!waist || waist < 20) {
        showToast('Please enter a valid waist measurement', 'error');
        return false;
    }
    userData.waist = waist;
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
    const sleepEl = q('#sleep');
    if (!sleepEl) return false;
    
    const sleep = Number(sleepEl.value);
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

function clearErrorMessages() {
    // Clear any existing error messages
    const errors = qa('.error-message');
    errors.forEach(error => error.remove());
}

// Unit toggle functionality
function setupUnitToggles() {
    try {
        // Height unit toggle
        const heightButtons = qa('#step-3 .unit-btn');
        heightButtons.forEach(btn => {
            btn.addEventListener('keydown', handleUnitKeydown);
        });
        
        // Weight unit toggle  
        const weightButtons = qa('#step-4 .unit-btn');
        weightButtons.forEach(btn => {
            btn.addEventListener('keydown', handleUnitKeydown);
        });
    } catch (error) {
        console.error('Unit toggle setup error:', error);
    }
}

function handleUnitKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.target.click();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const container = event.target.parentElement;
        const buttons = [...container.querySelectorAll('.unit-btn')];
        const currentIndex = buttons.indexOf(event.target);
        const nextIndex = event.key === 'ArrowRight' 
            ? (currentIndex + 1) % buttons.length 
            : (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
    }
}

function toggleHeightUnit(clickedBtn) {
    try {
        const buttons = qa('#step-3 .unit-btn');
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
        const buttons = qa('#step-4 .unit-btn');
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
        
        // Update waist unit label
        const waistUnit = q('#waist-unit');
        if (waistUnit) {
            waistUnit.textContent = unit === 'kg' ? 'cm' : 'in';
        }
    } catch (error) {
        console.error('Weight toggle error:', error);
    }
}

function setupKeyboardNavigation() {
    try {
        // Add keyboard support for radio groups
        const radioGroups = qa('[role="radiogroup"]');
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

// Calculation functions
function calculateResults() {
    try {
        const bmr = calculateBMR();
        const tdee = bmr * (ACTIVITY_MULTIPLIERS[userData.activity] || 1.2);
        const goalCalories = calculateGoalCalories(tdee);
        const bmi = calculateBMI();
        const waistToHeight = calculateWaistToHeight();
        const macros = calculateMacros(goalCalories);
        
        calculatedResults = {
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            goalCalories: Math.round(goalCalories),
            bmi: Math.round(bmi * 100) / 100,
            waistToHeight: Math.round(waistToHeight * 100) / 100,
            macros,
            userData: { ...userData }
        };
        
        displayResults();
        
        hideStep(currentStep);
        showStep('results');
        currentStep = 12; // Set to results step
        updateProgress();
        
    } catch (error) {
        console.error('Calculation error:', error);
        showToast('Calculation failed. Please check your inputs.', 'error');
    }
}

function calculateBMR() {
    const { age, gender, weight, height, bodyFat } = userData;
    
    // Use Katch-McArdle if body fat is available
    if (bodyFat) {
        const leanMass = weight * (1 - bodyFat / 100);
        return 370 + (21.6 * leanMass);
    }
    
    // Use Mifflin-St Jeor formula
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    
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
            return tdee + 500; // 1 lb per week gain
        default:
            return tdee;
    }
}

function calculateBMI() {
    const { weight, height } = userData;
    const heightInMeters = height / 100;
    return heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;
}

function calculateWaistToHeight() {
    const { waist, height } = userData;
    return height > 0 ? waist / height : 0;
}

function calculateMacros(goalCalories) {
    const { weight, goal, activity } = userData;
    
    // Protein calculation (1.2-2.0g per kg based on activity and goal)
    let proteinPerKg = 1.2;
    if (goal === 'gain') proteinPerKg = 1.8;
    else if (activity === 'active' || activity === 'super') proteinPerKg = 1.6;
    
    const proteinGrams = Math.round(weight * proteinPerKg);
    const proteinCalories = proteinGrams * 4;
    
    // Fat calculation (25-30% of calories)
    const fatCalories = Math.round(goalCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carbs get the rest
    const carbsCalories = goalCalories - proteinCalories - fatCalories;
    const carbsGrams = Math.round(Math.max(0, carbsCalories) / 4);
    
    // Calculate percentages safely
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
        const maintenanceEl = q('#maintenanceCalories');
        if (maintenanceEl) maintenanceEl.textContent = tdee.toLocaleString();
        
        const goalEl = q('#goalCalories');
        if (goalEl) goalEl.textContent = goalCalories.toLocaleString();
        
        const bmiEl = q('#bmi');
        if (bmiEl) bmiEl.textContent = bmi.toFixed(1);
        
        const waistEl = q('#waistToHeight');
        if (waistEl) waistEl.textContent = waistToHeight.toFixed(2);
        
        // BMI Category
        const bmiCategoryEl = q('#bmiCategory');
        if (bmiCategoryEl) {
            let category = 'Normal';
            if (bmi < BMI_THRESHOLDS.underweight) category = 'Underweight';
            else if (bmi > BMI_THRESHOLDS.overweight) category = 'Obese';
            else if (bmi > BMI_THRESHOLDS.normal) category = 'Overweight';
            bmiCategoryEl.textContent = category;
        }
        
        // Waist Category
        const waistCategoryEl = q('#waistCategory');
        if (waistCategoryEl) {
            let category = 'Low Risk';
            if (waistToHeight >= 0.6) category = 'High Risk';
            else if (waistToHeight >= 0.5) category = 'Increased Risk';
            waistCategoryEl.textContent = category;
        }
        
        // Goal Label
        const goalLabelEl = q('#goalLabel');
        if (goalLabelEl) {
            const labels = {
                lose: 'For weight loss',
                maintain: 'To maintain weight', 
                gain: 'For muscle gain'
            };
            goalLabelEl.textContent = labels[userData.goal] || 'For your goal';
        }
        
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
        const proteinAmountEl = q('#proteinAmount');
        const proteinBarEl = q('#proteinBar');
        if (proteinAmountEl) proteinAmountEl.textContent = `${macros.protein.grams}g (${macros.protein.percentage}%)`;
        if (proteinBarEl) proteinBarEl.style.width = `${macros.protein.percentage}%`;
        
        // Carbs
        const carbsAmountEl = q('#carbsAmount');
        const carbsBarEl = q('#carbsBar');
        if (carbsAmountEl) carbsAmountEl.textContent = `${macros.carbs.grams}g (${macros.carbs.percentage}%)`;
        if (carbsBarEl) carbsBarEl.style.width = `${macros.carbs.percentage}%`;
        
        // Fats
        const fatsAmountEl = q('#fatsAmount');
        const fatsBarEl = q('#fatsBar');
        if (fatsAmountEl) fatsAmountEl.textContent = `${macros.fats.grams}g (${macros.fats.percentage}%)`;
        if (fatsBarEl) fatsBarEl.style.width = `${macros.fats.percentage}%`;
    } catch (error) {
        console.error('Macro display error:', error);
    }
}

function displayRecommendations() {
    try {
        const { goal, sleep, stress, work, bodyFat } = userData;
        
        // Weekly goal
        const weeklyGoalEl = q('#weeklyGoal');
        if (weeklyGoalEl) {
            const goals = {
                lose: 'Safe weekly weight loss: 0.5-1.0 kg (1-2 lbs)',
                maintain: 'Focus on maintaining current weight with balanced nutrition',
                gain: 'Safe weekly weight gain: 0.25-0.5 kg (0.5-1 lbs)'
            };
            weeklyGoalEl.innerHTML = `<strong>Weekly Target:</strong> ${goals[goal]}`;
        }
        
        // Lifestyle tip
        const lifestyleTipEl = q('#lifestyleTip');
        if (lifestyleTipEl) {
            let tip = 'Stay consistent with your nutrition and exercise routine.';
            
            if (sleep < 7) {
                tip = 'Consider getting more sleep (7-9 hours) to support your metabolism and recovery.';
            } else if (stress === 'high') {
                tip = 'High stress can affect your metabolism. Consider stress management techniques.';
            } else if (work === 'desk') {
                tip = 'With a desk job, try to add more movement throughout your day.';
            }
            
            lifestyleTipEl.innerHTML = `<strong>Lifestyle Tip:</strong> ${tip}`;
        }
        
        // Body fat display
        const bodyFatDisplayEl = q('#bodyFatDisplay');
        if (bodyFatDisplayEl && bodyFat) {
            bodyFatDisplayEl.innerHTML = `<strong>Body Fat:</strong> ${bodyFat}% (used for more accurate BMR calculation)`;
        }
    } catch (error) {
        console.error('Recommendations display error:', error);
    }
}

// Export functions
function copyResultsJSON() {
    try {
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
        doc.text(`Height: ${userData.height.toFixed(0)}cm`, 20, y);
        y += 10;
        doc.text(`Weight: ${userData.weight.toFixed(1)}kg`, 20, y);
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
        
        // Reset all form inputs
        const inputs = qa('input');
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Reset unit toggles
        const unitBtns = qa('.unit-btn');
        unitBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        // Activate first unit buttons
        const firstHeightBtn = q('#step-3 .unit-btn[data-unit="cm"]');
        const firstWeightBtn = q('#step-4 .unit-btn[data-unit="kg"]');
        if (firstHeightBtn) {
            firstHeightBtn.classList.add('active');
            firstHeightBtn.setAttribute('aria-checked', 'true');
        }
        if (firstWeightBtn) {
            firstWeightBtn.classList.add('active');
            firstWeightBtn.setAttribute('aria-checked', 'true');
        }
        
        // Hide all steps and show welcome
        const steps = qa('.form-step');
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
