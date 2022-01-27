/* Utilities */
const includes = <T>(arr : Array<T>, elem : T) : boolean => arr.some(e => e === elem)
const sleep = (ms : number) : Promise<void> => new Promise(r => setTimeout(r, ms))

/* Types and interfaces */

type BlockState = 'empty' | 'entered' | 'opened' | 'present' | 'correct'
type KeyboardObjectType = {[key : string] : HTMLElement}

/* Game constants */
// TODO: More words
const WORDS = [
    'apple',
    'spice',
    'space',
    'power',
    'sugar',
    'grass',
    'sword',
    'house',
    'water'
]

const ANSWER = WORDS[Math.floor(Math.random() * WORDS.length)]
console.log(ANSWER)

// TODO: Stats screen on end of the game
// TODO: Updating the word every 24h
// TODO: Opening letters sequentially


// The representation of DIV in grid
class LetterBlock {
    blockElement : HTMLElement
    
    constructor(blockElement : HTMLElement) {
        this.blockElement = blockElement
        const blockClass = 'letter-block'
        
        blockElement.classList.add(blockClass)
        blockElement.dataset.state = 'empty'
    }

    setLetter(letter: string) {
        if (letter.length > 1) throw new Error(`setLetter accepts only one or zero letters, '${letter}' was given`)
        if (letter !== '')
            this.blockElement.dataset.state = 'opened'
        else
            this.blockElement.dataset.state = 'empty'
        this.blockElement.textContent = letter
        return this
    }

    setState(state : BlockState) {
        this.blockElement.dataset.state = state
        return this
    }
}

class GameGrid {
    gridElement : HTMLElement
    attempts : string[]
    currentWord : string
    wordMatrix : LetterBlock[][]
    didGameEnd :  boolean
    enterWordCallbacks : ((currentWord : string) => void)[]

    constructor(gridElement : HTMLElement) {
        this.gridElement = gridElement
        this.attempts = []
        this.currentWord = ''
        this.didGameEnd = false
        this.enterWordCallbacks = []
        const numberOfAttempts = 6
        const rowClass = 'word-row'

        this.wordMatrix = []
        for (let y = 0; y < numberOfAttempts; y ++) {
            this.wordMatrix.push([])
            const row = document.createElement('div')
            row.classList.add(rowClass)
            gridElement.appendChild(row)
            for (let x = 0; x < 5; x ++) {
                const elem = document.createElement('div')
                row.appendChild(elem)
                this.wordMatrix[y].push(new LetterBlock(elem))
            }
        }
    }

    setCurrentWord(word : string) {
        this.currentWord = word
        let row = this.wordMatrix[this.attempts.length]
        row.forEach((block, idx) => block.setLetter(idx < word.length ? word[idx] : ''))
    }
    
    handleError(message : string) {
        // TODO: Some kind of notification system
        console.error(message)
    }
    
    addLetter(letter : string) {
        if (this.didGameEnd)
            { this.handleError('The game is already finished'); return }
        if (!letter.match(/[a-zA-Z]/))
            { this.handleError('Only latin letters are allowed'); return }
        if (this.currentWord.length >= 5)
            { this.handleError('Words can be only length of 5'); return }

        if (letter.length !== 1) throw new Error(`addLetter accepts only one letter, '${letter}' was passed`)
        this.setCurrentWord(this.currentWord + letter.toLowerCase())
    }

    async enterWord() {
        if (this.didGameEnd)
            { this.handleError('The game is already finished'); return }
        if (this.currentWord.length < 5) 
            { this.handleError('Words can be noly length of 5'); return }
        if (!includes(WORDS, this.currentWord)) 
            { this.handleError(`Invalid word ${this.currentWord}`); return }
            
        if (this.currentWord === ANSWER) {
            console.log('WIN')
            this.didGameEnd = true
        }
        
        let row = this.wordMatrix[this.attempts.length];
        for (let idx = 0; idx < this.currentWord.split('').length; idx ++) {
            await sleep(200)
            const letter = this.currentWord.split('')[idx]
            if (letter === ANSWER[idx]) {
                row[idx].setState('correct')
                continue
            }
            if (includes(ANSWER.split(''), letter)) {
                row[idx].setState('present')
                continue
            }
            row[idx].setState('entered')
        }

        // Calling subscribed functions
        this.enterWordCallbacks.forEach(callback => callback(this.currentWord))

        this.attempts.push(this.currentWord)
        this.setCurrentWord('')
        if (this.attempts.length >= this.wordMatrix.length) {
            console.log('LOSE')
            this.didGameEnd = false
        }
    }

    subscribeToEnterWord(callback : (currentWord : string) => void) {
        this.enterWordCallbacks.push(callback)
    }

    removeLetter() {
        this.setCurrentWord(this.currentWord.substring(0, this.currentWord.length - 1))
    }
}

const gameGrid = new GameGrid(document.getElementById('game-grid')!)

window.addEventListener('keyup', e => {
    if (!e.key.match(/[A-Za-z]/) || e.key.length !== 1) return
    gameGrid.addLetter(e.key)    
})

window.addEventListener('keyup', e => {
    if (e.key === 'Backspace') gameGrid.removeLetter()
})

window.addEventListener('keydown', e => {
    if (e.key === "Enter") 
        gameGrid.enterWord()
})

/* Screen keyboard setup */

const keyboard = document.getElementById('keyboard')!
const keyboardMatrix : KeyboardObjectType = {}

function generateRow(buttons : string[], rowid : number) : void {
    const row = document.createElement('div')
    row.classList.add('keyboard-row')
    row.id = `row_${rowid}`
    
    buttons.forEach(btn => {
        const elem = document.createElement('div')
        elem.tabIndex = 0;
        elem.classList.add('keyboard-button')
        elem.textContent = btn
        elem.addEventListener('click', e => {
            if (elem.textContent === '<')
                { gameGrid.removeLetter(); return }
            if (elem.textContent === 'enter')
                {gameGrid.enterWord(); return}
            gameGrid.addLetter(elem.textContent || '')
        })
        row.appendChild(elem)    

        keyboardMatrix[btn] = elem
    })

    keyboard.appendChild(row)
}

generateRow('qwertyuiop'.split(''), 1)
generateRow('asdfghjkl'.split(''), 2)
generateRow(['enter', ...'zxcvbnm'.split(''), '<'], 3)

/* Displaying used letters on a keyboard */

gameGrid.subscribeToEnterWord((word : string) : void => {
    word.split('').forEach((letter, idx) => {
        let btnElem : HTMLElement = keyboardMatrix[letter]
        if (!btnElem) return

        if (letter === ANSWER[idx]) 
            { btnElem.dataset.state = 'correct'; return }
        if (includes(ANSWER.split(''), letter))
            { btnElem.dataset.state = 'present'; return }
        btnElem.dataset.state = 'entered'
    })
})