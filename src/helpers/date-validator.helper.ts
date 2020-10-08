export class DateValidator {
    validate(value: string) {
        const result = value.match(/([0-9]{4})[- ,./]([12][0-9]|0?[1-9])[- ,./](3[01]|[12][0-9]|0?[1-9])/)
        return result !== null;
    }
}