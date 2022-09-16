import React, {useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {setKeyStorePassword} from "../../../store/actions/generateKeyStore";
import {useTranslation} from "react-i18next";
import {PasswordValidation, ValidateSpace} from "../../../utils/validations";
import InputText from "../../../components/InputText";
import Icon from "../../../components/Icon";

const Password = () => {

    const {t} = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const password = useSelector((state) => state.generateKeyStore.password);
    const dispatch = useDispatch();

    const onChange = (evt) => {
        dispatch(setKeyStorePassword({
            value: evt.target.value,
            error: PasswordValidation(evt.target.value)
        }));
    };

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="form-field password-field">
            <p className="label">{t("PASSWORD")}</p>
            <div className="password-field-container">
                <InputText
                    className="form-control"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password.value}
                    required={true}
                    error={password.error}
                    onKeyPress={ValidateSpace}
                    placeholder={t("ENTER_PASSWORD")}
                    autofocus={false}
                    onChange={onChange}
                    autoComplete={"new-password"}
                />
                <span className="password-icon-section" onClick={handleShowPassword}
                >
                    <Icon
                        viewClass="password-icon"
                        icon={showPassword ? "show-password" : "hide-password"}/>
                </span>
            </div>
        </div>
    );
};


export default Password;
