function initAllowNumberOnly() {
    $("*[data-numberonly=true]").on("keypress", function (e) {
        const ASCIICode = e.which ? e.which : e.keyCode;
        if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57)) {
            return false;
        }
        return true;
    });
}

function initMoneyFormat() {
    $("*[data-moneyformat=true]").on("keyup", function (e) {
        const el = $(e.target);
        const value = el.val();
        el.val(moneyFormat(value));
    });
}

function moneyFormat(value) {
    let number = value.toString().replace(/,/g, '');
    if (!number) {
        return "";
    }
    number = new Intl.NumberFormat("en-US", {
        style: "decimal",
    }).format(number);
    return number;
}

function rupiahFormat(value) {
    return "Rp " + moneyFormat(value);
}

function formatDateIdn(arg) {
    const current = new Date(arg);
    const date = current.getDate() < 10 ? ("0" + current.getDate()) : current.getDate();
    const month = current.getMonth() < 10 ? ("0" + (current.getMonth() + 1)) : (current.getMonth() + 1);
    const year = current.getFullYear();
    return date + "-" + month + "-" + year;
}