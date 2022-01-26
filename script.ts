/* Utilities */
const includes = <T>(arr : Array<T>, elem : T) : boolean => arr.some(e => e === elem)

/* Types and interfaces */

type BlockState = 'empty' | 'open' | 'yellow' | 'green'

/* Game constants */
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
// TODO: Screen keyboard
// TODO: Updating the word every 24h


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
        this.blockElement.dataset.state = 'open'
        this.blockElement.innerHTML = letter
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

    constructor(gridElement : HTMLElement) {
        this.gridElement = gridElement
        this.attempts = []
        this.currentWord = ''
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
        if (!letter.match(/[a-zA-Z]/))
            { this.handleError('Only latin letters are allowed'); return }
        if (this.currentWord.length >= 5)
            { this.handleError('Words can be only length of 5'); return }

        if (letter.length !== 1) throw new Error(`addLetter accepts only one letter, '${letter}' was passed`)
        this.setCurrentWord(this.currentWord + letter)
    }

    enterWord() {
        if (this.currentWord.length < 5) 
            { this.handleError('Words can be noly length of 5'); return }
        if (!includes(WORDS, this.currentWord)) 
            { this.handleError(`Invalid word ${this.currentWord}`); return }
            
        if (this.currentWord === ANSWER) {
            console.log('WIN')
            // TODO: Block adding letters
        }

        let row = this.wordMatrix[this.attempts.length]
        this.currentWord.split('').forEach((letter, idx) => {
            if (letter === ANSWER[idx]) 
                { row[idx].setState('green'); return }
            if (includes(ANSWER.split(''), letter))
                { row[idx].setState('yellow'); return }
        })
        this.attempts.push(this.currentWord)
        this.setCurrentWord('')
        if (this.attempts.length >= this.wordMatrix.length) {
            console.log('LOSE')
            // TODO: Block adding letters
        }
    }

    removeLetter() {
        this.setCurrentWord(this.currentWord.substring(0, this.currentWord.length - 1))
    }
}

const gameGrid = new GameGrid(document.getElementById('game-grid'))

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