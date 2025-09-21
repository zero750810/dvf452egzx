class MagicCalculator {
    constructor() {
        this.displayElement = document.getElementById('result');
        this.historyElement = document.getElementById('history');
        this.displayArea = document.querySelector('.display');
        this.buttons = document.querySelectorAll('.btn');
        this.clearButton = document.getElementById('clear-btn');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.shouldResetDisplay = false;
        this.magicMode = false;
        this.buttonsLocked = false;
        this.firstNumber = 0;
        this.secondNumber = 0;
        this.magicStep = 0;
        this.secretPresses = 0;
        this.calculationComplete = false;
        this.doubleTapCount = 0;
        this.magicReady = false;
        this.magicNumber = 0;
        this.isScreenDown = false;
        this.firstSafetyActive = false;
        this.secondSafetyActive = false;

        this.initEventListeners();
        this.initOrientationDetection();
        this.initDisplayTapDetection();
        this.updateDisplay();
    }

    initEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (this.buttonsLocked) return;
                this.handleButtonClick(e.target);
            });
        });
    }

    initOrientationDetection() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.handleOrientationChange(e);
            });
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.checkForScreenFlip();
            }, 500);
        });
    }

    initDisplayTapDetection() {
        let tapCount = 0;
        let tapTimer = null;

        console.log('Display tap detection initialized');

        this.displayArea.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            tapCount++;
            console.log(`Tap ${tapCount} detected`);

            if (tapTimer) {
                clearTimeout(tapTimer);
            }

            tapTimer = setTimeout(() => {
                console.log(`Timer expired with ${tapCount} taps`);
                if (tapCount >= 2) {
                    this.doubleTapCount = tapCount;
                    console.log(`Double tap detected: ${tapCount} taps - activating first safety`);
                    this.activateFirstSafety();
                }
                tapCount = 0;
            }, 500);
        });

        // Also try with touchend for mobile
        this.displayArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            tapCount++;
            console.log(`Touch ${tapCount} detected`);

            if (tapTimer) {
                clearTimeout(tapTimer);
            }

            tapTimer = setTimeout(() => {
                console.log(`Touch timer expired with ${tapCount} taps`);
                if (tapCount >= 2) {
                    this.doubleTapCount = tapCount;
                    console.log(`Double touch detected: ${tapCount} taps - activating first safety`);
                    this.activateFirstSafety();
                }
                tapCount = 0;
            }, 500);
        });
    }

    handleOrientationChange(event) {
        const { beta } = event;

        // Check if screen is face down on table (beta around 180 degrees)
        const isScreenDown = beta > 160 || beta < -160;

        if (isScreenDown && !this.isScreenDown) {
            this.isScreenDown = true;
            console.log('Screen placed face down - locking all buttons');
            this.lockAllButtons();

            // If first safety is active, also activate second safety
            if (this.firstSafetyActive) {
                console.log('Second safety activated');
                this.activateSecondSafety();
            }
        } else if (!isScreenDown && this.isScreenDown) {
            this.isScreenDown = false;
            console.log('Screen lifted up - unlocking buttons');
            this.unlockAllButtons();
        }
    }

    checkForScreenFlip() {
        // Alternative method for orientation change
        console.log('Screen flip detected via orientation change');
        this.lockAllButtons();

        if (this.firstSafetyActive && !this.secondSafetyActive) {
            this.activateSecondSafety();
        }
    }

    lockAllButtons() {
        this.buttonsLocked = true;
        this.buttons.forEach(button => {
            button.classList.add('disabled');
        });
        console.log('All buttons locked');
    }

    unlockAllButtons() {
        this.buttonsLocked = false;
        this.buttons.forEach(button => {
            button.classList.remove('disabled');
        });
        console.log('All buttons unlocked');
    }

    handleButtonClick(button) {
        const action = button.dataset.action;
        const number = button.dataset.number;

        if (number) {
            this.inputNumber(number);
        } else if (action) {
            this.handleAction(action);
        }

        this.updateDisplay();
    }

    inputNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentInput = '';
            this.shouldResetDisplay = false;
        }

        if (this.currentInput.length < 9) {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }

        // Clear history when inputting numbers
        this.historyElement.textContent = '';

        this.updateClearButton();

        if (this.magicStep === 1 && this.operator === '') {
            this.firstNumber = parseFloat(this.currentInput);
        } else if (this.magicStep === 2 && this.operator === 'add') {
            this.secondNumber = parseFloat(this.currentInput);
        }
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'plus-minus':
                this.toggleSign();
                break;
            case 'percent':
                this.percentage();
                break;
            case 'add':
                this.setOperator('add');
                break;
            case 'subtract':
                this.setOperator('subtract');
                break;
            case 'multiply':
                this.setOperator('multiply');
                break;
            case 'divide':
                this.setOperator('divide');
                break;
            case 'equals':
                this.calculate();
                break;
            case 'decimal':
                this.addDecimal();
                break;
        }
    }

    setOperator(op) {
        if (this.currentInput === '') return;

        if (this.previousInput !== '' && this.operator !== '' && !this.shouldResetDisplay) {
            this.calculate();
        }

        this.operator = op;
        this.previousInput = this.currentInput;
        this.shouldResetDisplay = true;
        this.calculationComplete = false;

        // Clear history when setting operator
        this.historyElement.textContent = '';

        this.updateOperatorButtons();

        if (op === 'add' && this.magicStep === 0 && this.firstNumber === 0) {
            this.magicStep = 1;
            this.firstNumber = parseFloat(this.currentInput);
        }
    }

    calculate() {
        if (this.previousInput === '' || this.currentInput === '' || this.operator === '') {
            return;
        }

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        let result;

        switch (this.operator) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                result = current !== 0 ? prev / current : 0;
                break;
            default:
                return;
        }

        // Show the complete calculation in history
        const operatorSymbol = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷'
        }[this.operator] || '';

        this.historyElement.textContent = `${prev}${operatorSymbol}${current}`;

        this.currentInput = this.formatResult(result);
        this.previousInput = '';
        this.operator = '';
        this.shouldResetDisplay = true;
        this.calculationComplete = true;

        this.updateOperatorButtons();

        if (this.magicStep === 1) {
            this.magicStep = 2;
            this.secondNumber = current;
            this.startSecretPressDetection();
        }
    }

    startSecretPressDetection() {
        const resultValue = parseFloat(this.currentInput);

        this.buttons.forEach(button => {
            const originalHandler = button.onclick;

            button.addEventListener('click', () => {
                if (button.textContent === this.formatResult(resultValue)) {
                    this.secretPresses++;

                    if (this.secretPresses >= 2) {
                        this.magicMode = true;
                        this.secretPresses = 0;
                    }
                }
            });
        });
    }

    activateFirstSafety() {
        console.log('First safety activated - calculator button flash');
        this.firstSafetyActive = true;

        // Flash calculator button
        const calcButton = document.querySelector('[data-action="calculator"]');
        if (calcButton) {
            calcButton.style.backgroundColor = 'white';
            calcButton.style.color = '#333333';

            setTimeout(() => {
                calcButton.style.backgroundColor = '';
                calcButton.style.color = '';
                console.log('Calculator button flash completed');
            }, 500);
        }

        console.log('First safety active - waiting for screen to be placed face down');
    }

    activateSecondSafety() {
        console.log('Second safety activated - screen placed face down detected');
        this.secondSafetyActive = true;
        this.checkBothSafeties();
    }

    checkBothSafeties() {
        if (this.firstSafetyActive && this.secondSafetyActive) {
            console.log('Both safeties activated - triggering magic!');
            this.triggerMagicTrick();
        }
    }

    triggerMagicTrick() {
        if (this.buttonsLocked) return;

        console.log('Magic trick triggered!');

        // Calculate magic number from current date/time
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes() + 1;

        this.magicNumber = parseInt(`${month}${date.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`);

        // Get current calculation result
        const currentResult = parseFloat(this.currentInput);

        // Calculate: date/time - current result
        const finalResult = this.magicNumber - currentResult;

        // Set the magic calculation in the display
        this.currentInput = this.formatResult(finalResult);
        this.updateDisplay();

        console.log(`Magic calculation: ${this.magicNumber} - ${currentResult} = ${finalResult}`);

        // Reset safeties
        this.firstSafetyActive = false;
        this.secondSafetyActive = false;
    }

    animateToResult(finalResult) {
        let currentDisplayValue = parseFloat(this.currentInput);
        const step = (finalResult - currentDisplayValue) / 20;
        let iterations = 0;

        const animate = () => {
            if (iterations < 20) {
                currentDisplayValue += step;
                this.currentInput = this.formatResult(currentDisplayValue);
                this.updateDisplay();
                iterations++;
                setTimeout(animate, 100);
            } else {
                this.currentInput = this.formatResult(finalResult);
                this.updateDisplay();
            }
        };

        animate();
    }

    clear() {
        if (this.clearButton.textContent === '⌫') {
            // Delete last digit
            if (this.currentInput.length > 1) {
                this.currentInput = this.currentInput.slice(0, -1);
            } else {
                this.currentInput = '0';
            }
        } else {
            // AC - Clear everything
            this.currentInput = '0';
            this.previousInput = '';
            this.operator = '';
            this.shouldResetDisplay = false;
            this.magicMode = false;
            this.buttonsLocked = false;
            this.magicStep = 0;
            this.secretPresses = 0;
            this.firstNumber = 0;
            this.secondNumber = 0;
            this.calculationComplete = false;
            this.magicReady = false;
            this.doubleTapCount = 0;
            this.magicNumber = 0;
            this.isScreenDown = false;
            this.firstSafetyActive = false;
            this.secondSafetyActive = false;

            this.buttons.forEach(button => {
                button.classList.remove('disabled');
            });

            this.updateOperatorButtons();
        }

        // Clear history on AC
        this.historyElement.textContent = '';
        this.updateClearButton();
    }


    updateClearButton() {
        if (this.currentInput === '0' && this.previousInput === '' && this.operator === '') {
            this.clearButton.textContent = 'AC';
        } else {
            this.clearButton.textContent = '⌫';
        }
    }

    toggleSign() {
        if (this.currentInput !== '0') {
            this.currentInput = this.currentInput.startsWith('-')
                ? this.currentInput.slice(1)
                : '-' + this.currentInput;
        }
    }

    percentage() {
        this.currentInput = this.formatResult(parseFloat(this.currentInput) / 100);
    }

    addDecimal() {
        if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }
    }

    formatResult(num) {
        if (isNaN(num)) return '0';

        const str = num.toString();
        if (str.length > 9) {
            if (num >= 1000000000 || num <= -1000000000) {
                return num.toExponential(2);
            } else {
                return parseFloat(num.toFixed(9 - str.indexOf('.'))).toString();
            }
        }
        return str;
    }

    updateDisplay() {
        this.displayElement.textContent = this.currentInput;

        const length = this.currentInput.length;
        if (length > 6) {
            this.displayElement.style.fontSize = '60px';
        } else if (length > 9) {
            this.displayElement.style.fontSize = '40px';
        } else {
            this.displayElement.style.fontSize = '80px';
        }
    }

    updateOperatorButtons() {
        this.buttons.forEach(button => {
            if (button.classList.contains('operator')) {
                if (button.dataset.action === this.operator) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

const calculator = new MagicCalculator();