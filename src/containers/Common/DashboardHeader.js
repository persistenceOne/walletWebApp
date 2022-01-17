import React, {useEffect} from "react";
import Icon from "../../components/Icon";
import {NavLink, useHistory} from 'react-router-dom';
import {Nav, Navbar, NavDropdown} from "react-bootstrap";
import ReactQRCode from "qrcode.react";
import Copy from "../../components/Copy";
import helper from "../../utils/helper";
import {useTranslation} from "react-i18next";
import Darktheme from "../DarkTheme";
import MobileSidebar from "./MobileSidebar";
import transactions from "../../utils/transactions";
import config from "../../config";
import {userLogout} from "../../store/actions/logout";
import {useDispatch} from "react-redux";
import {showKeyStoreMnemonicModal} from "../../store/actions/generateKeyStore";
import {ACCOUNT_NUMBER, ADDRESS, ADDRESS_INDEX, LOGIN_MODE, THEME} from "../../constants/localStorage";

const EXPLORER_API = process.env.REACT_APP_EXPLORER_API;

const DashboardHeader = () => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    const address = localStorage.getItem(ADDRESS);
    let addressTruncate;
    if (address !== null) {
        addressTruncate = helper.stringTruncate(address);
    }
    useEffect(() => {
        const localTheme = window.localStorage.getItem(THEME);
        if (localTheme === 'light') {
            if (document.getElementById('root').classList.contains('dark-mode')) {
                document.getElementById('root').classList.add('light-mode');
                document.getElementById('root').classList.remove('dark-mode');
            }
        } else {
            if (document.getElementById('root').classList.contains('light-mode')) {
                document.getElementById('root').classList.add('dark-mode');
                document.getElementById('root').classList.remove('light-mode');
            }
        }

    }, []);
    const closeWallet = () => {
        dispatch(userLogout());
        localStorage.clear();
        history.push('/');
        window.location.reload();
    };
    const handleKeyStore = () => {
        dispatch(showKeyStoreMnemonicModal());
    };
    const ledgerShowAddress = async () => {
        const accountNumber = localStorage.getItem(ACCOUNT_NUMBER);
        const addressIndex = localStorage.getItem(ADDRESS_INDEX);
        const [wallet] = await transactions.LedgerWallet(transactions.makeHdPath(accountNumber, addressIndex), config.addressPrefix);
        await wallet.showAddress(transactions.makeHdPath(accountNumber, addressIndex));
    };
    const ProfileIcon = <Icon viewClass="profile" icon="profile"/>;
    return (
        <div className="header dashboard">
            <Navbar collapseOnSelect expand="lg">
                <div className="container">
                    <div className="nav-menu-icon">
                        <MobileSidebar/>
                    </div>
                    <Navbar.Brand>
                        <NavLink to="/dashboard/wallet" className="header-logo">
                            {/*<img src={theme === 'light' ? logo : logoDark} alt="logo"/>*/}
                        </NavLink>
                    </Navbar.Brand>

                    <Nav className="ml-auto">
                        <li className="nav-item link mobile-nav-item">
                            <NavLink className="nav-link primary-medium-color"
                                to="/dashboard/wallet">
                                <div className="icon-box">
                                    <Icon
                                        viewClass="icon"
                                        icon="wallet"
                                    />
                                </div>
                                {t("WALLET")}
                            </NavLink>
                        </li>
                        <li className="nav-item link mobile-nav-item">
                            <NavLink className="nav-link primary-medium-color"
                                to="/dashboard/staking">
                                <div className="icon-box">
                                    <Icon
                                        viewClass="icon"
                                        icon="staking"/>
                                </div>
                                {t("STAKING")}
                            </NavLink>
                        </li>
                        <li className="nav-item link mobile-nav-item">
                            <a className="nav-link primary-medium-color" href={EXPLORER_API}
                                rel="noopener noreferrer" target="_blank">
                                <div className="icon-box">
                                    <Icon
                                        viewClass="icon"
                                        icon="explorer"/>
                                </div>
                                {t("EXPLORER")}
                                <div className="icon-box">
                                    <Icon
                                        viewClass="icon"
                                        icon="export"/>
                                </div>
                            </a>
                        </li>
                        <li className="nav-item link mobile-nav-item">
                            <a className="nav-link primary-medium-color"
                                href="https://notes.persistence.one/s/9l80_chis" rel="noopener noreferrer"
                                target="_blank">
                                <div className="icon-box">
                                    <Icon
                                        viewClass="icon"
                                        icon="help"/>
                                </div>
                                {t("HELP")}
                            </a>
                        </li>
                        <li className="profile-section">
                            <NavDropdown title={ProfileIcon} id="basic-nav-dropdown" className="profile-dropdown">
                                <div className="info">
                                    <div className="qr-box">
                                        <ReactQRCode value={address}/>
                                    </div>

                                    <p className="key"> {t("WALLET_ADDRESS")}
                                        {
                                            localStorage.getItem(LOGIN_MODE) === 'ledger' ?
                                                <button className="ledger-verify"
                                                    onClick={ledgerShowAddress}>{t("VERIFY")}</button>
                                                : ""
                                        }</p>
                                    <div className="address"><span>{addressTruncate}</span> <Copy id={address}/>
                                    </div>
                                </div>
                                <div className="dropdown-footer">
                                    <p onClick={closeWallet} className="link-close">Logout</p>
                                    <p onClick={handleKeyStore} className="generate-keystore">Generate KeyStore</p>
                                </div>
                            </NavDropdown>
                        </li>
                        <li className="nav-item link"><Darktheme/></li>

                    </Nav>
                </div>
            </Navbar>
        </div>
    );
};
export default DashboardHeader;
