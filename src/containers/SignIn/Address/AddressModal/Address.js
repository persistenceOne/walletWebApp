import React from 'react';
import InputText from "../../../../components/InputText";
import helper from "../../../../utils/helper";
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import {setAddress} from "../../../../store/actions/signIn/address";

const Address = () => {
    const {t} = useTranslation();
    const address = useSelector((state) => state.signInAddress.address);
    const dispatch = useDispatch();

    const onChange = (evt) => {
        dispatch(setAddress({
            value:evt.target.value,
            error: {
                message:''
            }
        }));
    };

    return (
        <>
            <div className="form-field">
                <p className="label">{t("ADDRESS")}</p>
                <InputText
                    className="form-control"
                    name="address"
                    type="text"
                    value={address.value}
                    required={true}
                    error={address.error}
                    onKeyPress={helper.inputSpaceValidation}
                    placeholder={t("ENTER_ADDRESS")}
                    autofocus={false}
                    onChange={onChange}
                />
            </div>
        </>
    );
};


export default Address;
