function initAllowNumberOnly() {
    $("*[data-numberonly=true]").on("keypress", function(e) {
        const ASCIICode = e.which ? e.which : e.keyCode;
        if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57)) {
            return false;
        }
        return true;
    });
}