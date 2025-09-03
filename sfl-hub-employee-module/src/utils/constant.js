export const isEmpty = (value) => {
    if (value === undefined || value === null || value === "") {
        return true;
    }
    if (typeof value === "string") {
        return value.trim() === "";
    }
    return false;
};

// export const RegExpConfig = {
//   number: /^[0-9\b]+$/,
//   onlyNumber: /[a-zA-Z~`!@#$%^&*()_+=-{}|:"<>?,;']+$/,
//   onlyDecimal: /^[0-9]+(\.[0-9][0-9])?$/,
//   phoneNumber: /^([0-9]+\s?)*$/g,
//   email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
//   companyName: /[!@~`#$%^*()_+\-=\[\]{};':"\\|<>\/?]/,
//   zipCode: /^([a-zA-Z0-9]+\s?)*$/g,
//   regExpNumber: /[0-9]/g,
//   regExpUpperCase: /[A-Z]/g,
//   regExpLowerCase: /[a-z]/g,
//   regExpSpecialCharacter: /[!@#$%^&*(),.?":{}|<>]/g,
//   userNameSpecialCharacter: /[@\._-]/g,
//   NofirstInputSpecialCharacter: /[a-zA-Z0-9][@._-]/g,
//   userErrorSpecial: /[!~`#$%^&*()+<>/:;"',|]/g,
//   exceptCirilic: /^[\s\S]*$/,
// };