// import { setInterval } from 'timers';

/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Instructions

const HLT = 0b00011011; // Halt CPU
const ADD = 0b00001100;
const CALL = 0b00001111;
const LDI = 0b00000100;
const MUL = 0b00000101;
const PRN = 0b00000110;
const POP = 0b00001011;
const PUSH = 0b00001010;
const RET = 0b00010000;
const JMP = 0b00010001;

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {

    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers

        // Special-purpose registers
        this.reg.PC = 0; // Program Counter
        this.reg.IR = 0; // Instruction Register

        this.setupBranchTable();
    }

	/**
	 * Sets up the branch table
	 */
    setupBranchTable() {
        let bt = {};

        bt[HLT] = this.HLT;
        bt[LDI] = this.LDI;
        bt[MUL] = this.MUL;
        bt[PRN] = this.PRN;
        bt[ADD] = this.ADD;
        bt[CALL] = this.CALL;
        bt[POP] = this.POP;
        bt[PUSH] = this.PUSH;
        bt[RET] = this.RET;
        bt[JMP] = this.JMP;

        this.branchTable = bt;
    }

    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {

        // console.log("RAM dump");
        // for (let i = 0; i < 15; i++) {
        //     console.log(this.ram.read(i).toString(2));
        // }

        const _this = this;

        this.clock = setInterval(() => {
            _this.tick();
        }, 1);

        this.timerHandle = setInterval(() => {
            // Trigger timer interrupt
            // Need IM and IS registers
            // e.g.-set bit 0 of IS to 1
            // this.reg[6] = this.reg[6] | 0b00000001;
            this.reg[6] |= 0b00000001; // shorthand

        }, 1000); // 1sec
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
        clearInterval(this.timerHandle);
    }

    /**
     * ALU functionality
     * 
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        let valA = this.reg[regA];
        let valB = this.reg[regB];
        // console.log(`valA: ${valA}  valB: ${valB}`);

        switch (op) {
            case 'MUL':
                // !!! IMPLEMENT ME
                this.reg[regA] = (valA * valB) & 255;
                break;
            case 'ADD':
                this.reg[regA] = (valA + valB) & 255;
                break;
        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // !!! IMPLEMENT ME

        // Check if an interrupt happened
        // if it did, jump to that interrupt handler


        // Load the instruction register from the current PC
        this.reg.IR = this.ram.read(this.reg.PC);

        // Debugging output
        // console.log(`${this.reg.PC}: ${this.reg.IR.toString(2)}`);

        // Based on the value in the Instruction Register, jump to the
        // appropriate hander in the branchTable
        const handler = this.branchTable[this.reg.IR];

        // Check that the handler is defined, halt if not (invalid
        // instruction)
        if (!handler) {
            console.error(`Invalid instruction at address ${this.reg.PC}: ${this.reg.IR.toString(2)}`);
            this.stopClock();
            return;
        }

        // We need to use call() so we can set the "this" value inside
        // the handler (otherwise it will be undefined in the handler)
        handler.call(this);
    }

    // INSTRUCTION HANDLER CODE:

    /**
     * ADD
     */
    ADD() {
        const regA = this.ram.read(this.reg.PC + 1);
        const regB = this.ram.read(this.reg.PC + 2);

        this.alu('ADD', regA, regB);

        this.reg.PC += 3; // move PC
    }

    /**
     * CALL R
     */
    CALL() {
        const regA = this.ram.read(this.reg.PC + 1);

        // Push address of next instruction on stack
        this.reg[7]--; // dec R7 (SP reg)
        this.ram.write(this.reg[7], this.reg.PC + 2);

        // Jump to the address stored in regA
        this.reg.PC = this.reg[regA];
    }

    /**
     * HLT
     */
    HLT() {
        this.stopClock();
    }

    /**
     * LDI R,I
     */
    LDI() {
        const regA = this.ram.read(this.reg.PC + 1);
        const val = this.ram.read(this.reg.PC + 2); // immed. val.

        this.reg[regA] = val;
        this.reg.PC += 3; // move PC
    }

    /**
     * MUL R,R
     */
    MUL() {
        const regA = this.ram.read(this.reg.PC + 1);
        const regB = this.ram.read(this.reg.PC + 2);

        this.alu('MUL', regA, regB);

        this.reg.PC += 3; // move PC
    }

    /**
     * PRN R
     */
    PRN() {
        const regA = this.ram.read(this.reg.PC + 1);
        console.log(this.reg[regA]);

        this.reg.PC += 2;
    }

    /**
     * POP R
     */
    POP() {
        const regA = this.ram.read(this.reg.PC + 1);
        const stackVal = this.ram.read(this.reg[7]);

        this.reg[regA] = stackVal;

        this.reg[7]++;
        this.reg.PC += 2;
    }

    /**
     * PUSH R
     */
    PUSH() {
        const regA = this.ram.read(this.reg.PC + 1);

        this.reg[7]--; // dec R7 (SP reg)
        this.ram.write(this.reg[7], this.reg[regA]);

        this.reg.PC += 2;
    }

    /**
     * RET
     */
    RET() {
        this.reg.PC = this.ram.read(this.reg[7]);

        this.reg[7]++; // incr SP reg
    }

    /**
     * JMP R
     */
    JMP() {
        const regA = this.ram.read(this.reg.PC + 1);

        this.reg.PC = this.reg[regA];
    }
}

module.exports = CPU;
