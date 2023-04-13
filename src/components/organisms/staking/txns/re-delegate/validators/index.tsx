import React, { useState } from "react";
import { useAppStore } from "../../../../../../../store/store";
import ToggleSwitch from "../../../../../atoms/switch";
import ValidatorsDrodown from "./validatorsDrodown";

const Validators = () => {
  const [value, setValue] = useState(false);
  const validatorsInfo = useAppStore((state) => state.wallet.validatorsInfo);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-light-emphasis">Validators</p>
        <ToggleSwitch
          isOn={value}
          color="#EF476F"
          variant={"small"}
          onChange={() => setValue(!value)}
        />
      </div>

      <ValidatorsDrodown
        activeValidatorsType={value ? "active" : "in-active"}
      />
    </div>
  );
};

export default Validators;
