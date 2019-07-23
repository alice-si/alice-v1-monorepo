pragma solidity ^0.5.2;

//Contract only for testing purposes.
//Don't connect to other contracts or use in a production environment.
//It registers and store performed validations.
contract MockValidation {

    event ValidationEvent(uint time, address indexed validator, string outcome, uint value);

    struct Validation {
        uint time;
        address validator;
        string outcome;
        uint value;
    }

    Validation[] validations;

    function validate(string memory outcome, uint value) public {
        Validation memory validation = Validation(now, msg.sender, outcome, value);
        validations.push(validation);
        emit ValidationEvent(validation.time, validation.validator, validation.outcome, validation.value);
    }

    function getValidationsCount() view public returns(uint count) {
        return validations.length;
    }

    function getValidatorByIndex(uint index) view public returns(address validator) {
        return validations[index].validator;
    }

    function getOutcomeByIndex(uint index) view public returns(string memory outcome) {
        return validations[index].outcome;
    }

    function getValueByIndex(uint index) view public returns(uint value) {
        return validations[index].value;
    }

}
