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
        this.buttonsLocked = false;
        this.clearMode = 'AC'; // Track clear button mode: 'AC' or 'C'

        // Long press variables
        this.isLongPressing = false;
        this.longPressTimer = null;
        this.magicCalculated = false;

        this.initEventListeners();
        this.initDisplayLongPress();
        this.initCalculatorButton();
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

    initDisplayLongPress() {
        console.log('Display long press detection initialized');

        // Mouse events
        this.displayArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startLongPress();
        });

        this.displayArea.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.endLongPress();
        });

        this.displayArea.addEventListener('mouseleave', (e) => {
            this.endLongPress();
        });

        // Touch events for mobile
        this.displayArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startLongPress();
        });

        this.displayArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endLongPress();
        });

        this.displayArea.addEventListener('touchcancel', (e) => {
            this.endLongPress();
        });
    }

    startLongPress() {
        if (this.isLongPressing) return;

        console.log('Long press started');
        this.isLongPressing = true;
        this.magicCalculated = false;

        // Lock all buttons immediately
        this.lockAllButtons();

        // Set timer for 5 seconds
        this.longPressTimer = setTimeout(() => {
            if (this.isLongPressing && !this.magicCalculated) {
                console.log('5 seconds reached - triggering magic calculation');
                this.triggerMagicCalculation();
                this.magicCalculated = true;
            }
        }, 5000);
    }

    endLongPress() {
        if (!this.isLongPressing) return;

        console.log('Long press ended');
        this.isLongPressing = false;

        // Clear timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Unlock all buttons
        this.unlockAllButtons();
    }

    lockAllButtons() {
        this.buttonsLocked = true;
        console.log('All buttons locked');
    }

    unlockAllButtons() {
        this.buttonsLocked = false;
        console.log('All buttons unlocked');
    }

    triggerMagicCalculation() {
        console.log('Magic calculation triggered!');

        // Calculate magic number from current date/time
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes() + 1;

        this.magicNumber = parseInt(`${month}${date.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`);

        // Get current calculation result (remove commas first)
        const currentResult = parseFloat(this.currentInput.replace(/,/g, ''));

        // Calculate: date/time - current result
        let finalResult = this.magicNumber - currentResult;

        // If result is negative, make it positive
        if (finalResult < 0) {
            finalResult = Math.abs(finalResult);
        }

        // Set the magic calculation in the display
        this.currentInput = this.formatResult(finalResult);
        this.updateDisplay();

        console.log(`Magic calculation: ${this.magicNumber} - ${currentResult} = ${finalResult}`);
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

        // Switch to C mode when user starts typing
        this.clearMode = 'C';
        this.updateClearButton();
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
            case 'calculator':
                // Calculator hint is handled by mousedown/touchstart events
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

        // Show current number + operator in history
        const operatorSymbol = {
            'add': '+',
            'subtract': '−',
            'multiply': '×',
            'divide': '÷'
        }[op] || '';

        this.historyElement.textContent = `${this.addCommas(this.currentInput)}${operatorSymbol}`;

        this.updateOperatorButtons();
    }

    calculate() {
        if (this.previousInput === '' || this.currentInput === '' || this.operator === '') {
            return;
        }

        // Remove commas before parsing
        const prev = parseFloat(this.previousInput.replace(/,/g, ''));
        const current = parseFloat(this.currentInput.replace(/,/g, ''));
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

        // Switch to AC mode after calculation
        this.clearMode = 'AC';

        this.updateOperatorButtons();
    }

    clear() {
        if (this.clearMode === 'AC') {
            // AC - Clear everything
            this.currentInput = '0';
            this.previousInput = '';
            this.operator = '';
            this.shouldResetDisplay = false;
            this.historyElement.textContent = '';
            this.updateOperatorButtons();
            // Stay in AC mode after clearing everything
        } else {
            // C - Delete last digit
            if (this.currentInput.length > 1) {
                this.currentInput = this.currentInput.slice(0, -1);
            } else {
                this.currentInput = '0';
                // Don't change mode when deleting to 0, keep C mode
            }
        }

        this.updateClearButton();
    }

    updateClearButton() {
        // 不顯示文字，只保留功能
        this.clearButton.textContent = '';
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

        // Add comma formatting for large numbers
        return this.addCommas(str);
    }

    addCommas(numStr) {
        // Split into integer and decimal parts
        const parts = numStr.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];

        // Add commas to integer part
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Combine back with decimal part if exists
        return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }

    updateDisplay() {
        // Format the current input with commas for display
        const formattedInput = this.addCommas(this.currentInput);
        this.displayElement.textContent = formattedInput;

        const length = formattedInput.length;
        if (length > 6) {
            this.displayElement.style.fontSize = '60px';
        } else if (length > 9) {
            this.displayElement.style.fontSize = '40px';
        } else {
            this.displayElement.style.fontSize = '80px';
        }
    }

    initCalculatorButton() {
        const calculatorButton = document.querySelector('[data-action="calculator"]');

        // Add mousedown/touchstart for press
        calculatorButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.showCalculatorHint();
        });

        calculatorButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.showCalculatorHint();
        });

        // Add mouseup/touchend for release
        calculatorButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.hideCalculatorHint();
        });

        calculatorButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.hideCalculatorHint();
        });

        calculatorButton.addEventListener('mouseleave', (e) => {
            this.hideCalculatorHint();
        });

        calculatorButton.addEventListener('touchcancel', (e) => {
            this.hideCalculatorHint();
        });
    }

    showCalculatorHint() {
        // Get current number (remove commas)
        const currentNumber = parseFloat(this.currentInput.replace(/,/g, '')) || 0;

        // Get current time in MMDDHHMM format
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes() + 1;

        const timeNumber = parseInt(`${month}${date.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`);

        // Calculate difference
        const difference = timeNumber - currentNumber;
        const isAdd = difference >= 0;
        const absoluteDifference = Math.abs(difference);

        // Get the number of digits we need to highlight
        const digitCount = absoluteDifference.toString().length;
        const operation = isAdd ? 'add' : 'subtract';

        console.log(`Hint: ${currentNumber} ${isAdd ? '+' : '-'} ${absoluteDifference} (${digitCount}位數) = ${timeNumber}`);

        // Highlight the digit count and operation
        this.highlightDigitCount(digitCount);
        this.highlightOperation(operation);
    }

    hideCalculatorHint() {
        this.clearAllHighlights();
    }

    highlightDigitCount(digitCount) {
        // Clear previous highlights
        this.clearDigitHighlights();

        // Highlight the digit that represents the count
        // For example: 1377118 is 7 digits, so highlight the "7" button
        const digitButton = document.querySelector(`[data-number="${digitCount}"]`);
        if (digitButton) {
            this.addHighlight(digitButton);
        }
    }

    highlightOperation(operation) {
        // Clear previous operation highlights
        this.clearOperationHighlights();

        const operationButton = document.querySelector(`[data-action="${operation}"]`);
        if (operationButton) {
            this.addHighlight(operationButton);
        }
    }

    addHighlight(button) {
        const highlight = document.createElement('div');
        highlight.className = 'calculator-hint-dot';
        highlight.style.cssText = `
            position: absolute;
            top: 20px;
            right: 5px;
            width: 8px;
            height: 8px;
            background-color: #ff9500;
            border-radius: 50%;
            z-index: 100;
            pointer-events: none;
        `;
        button.style.position = 'relative';
        button.appendChild(highlight);
    }

    clearDigitHighlights() {
        // Remove highlights from all number buttons
        document.querySelectorAll('[data-number]').forEach(button => {
            const highlights = button.querySelectorAll('.calculator-hint-dot');
            highlights.forEach(dot => dot.remove());
        });
    }

    clearOperationHighlights() {
        // Remove highlights from operation buttons
        document.querySelectorAll('[data-action="add"], [data-action="subtract"]').forEach(button => {
            const highlights = button.querySelectorAll('.calculator-hint-dot');
            highlights.forEach(dot => dot.remove());
        });
    }

    clearAllHighlights() {
        // Remove all hint dots
        document.querySelectorAll('.calculator-hint-dot').forEach(dot => dot.remove());
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

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

const calculator = new MagicCalculator();