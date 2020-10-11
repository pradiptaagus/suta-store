export class DateGenerator {
    private current: Date;
    private year: number;
    private month: number;
    private date: number;
    private hour: number;
    private minute: number;
    private second: number;
    private milisecond: number;

    constructor() {
        this.current = new Date();
        this.year = this.current.getFullYear();
        this.month = this.current.getMonth() + 1;
        this.date = this.current.getDate();
        this.hour = this.current.getHours();
        this.minute = this.current.getMinutes();
        this.second = this.current.getSeconds();
        this.milisecond = this.current.getMilliseconds();
    }
    
    generateTimestamp() {
        return `${this.year}-${this.month}-${this.date} ${this.hour}:${this.minute}:${this.second}.${this.milisecond}`;
    }
}