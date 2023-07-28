import {
  TX_TOKENIZE_AMOUNT_SET,
  TX_TOKENIZE_MEMO_SET,
  TX_TOKENIZE_MODAL_HIDE,
  TX_TOKENIZE_MODAL_SHOW,
  TX_TOKENIZE_OWNER_ADDRESS_SET,
  TX_TOKENIZE_SHARE_STATUS_SET
} from "../../../constants/tokenizeShares";
import { setTxIno, setTxName } from "./common";
import { showFeeModal } from "./fee";

export const setTxTokenizeAmount = (data) => {
  return {
    type: TX_TOKENIZE_AMOUNT_SET,
    data
  };
};

export const showTxTokenizeModal = (data) => {
  return {
    type: TX_TOKENIZE_MODAL_SHOW,
    data
  };
};

export const hideTxTokenizeModal = (data) => {
  return {
    type: TX_TOKENIZE_MODAL_HIDE,
    data
  };
};

export const setTxMemo = (data) => {
  return {
    type: TX_TOKENIZE_MEMO_SET,
    data
  };
};

export const setTxTokenizeOwnerAddress = (data) => {
  return {
    type: TX_TOKENIZE_OWNER_ADDRESS_SET,
    data
  };
};

export const setTxTokenizeShareStatus = (data) => {
  return {
    type: TX_TOKENIZE_SHARE_STATUS_SET,
    data
  };
};

export const submitFormData = (message) => (dispatch, getState) => {
  dispatch(
    setTxName({
      value: {
        name: "tokenize"
      }
    })
  );
  dispatch(
    setTxIno({
      value: {
        modal: showTxTokenizeModal(),
        data: {
          message: message,
          memo: getState().tokenizeShares.memo.value
        }
      }
    })
  );
  dispatch(hideTxTokenizeModal());
  dispatch(showFeeModal());
};
