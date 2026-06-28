import React, { useState } from "react";
import AccountTreeSelector from "./AccountTreeSelector";

function AccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState(null);

  return (
    <div>
      <h2>📒 مدیریت حساب‌ها</h2>
      <AccountTreeSelector onSelect={(acc) => setSelectedAccount(acc)} />
      {selectedAccount && (
        <p>
          حساب انتخاب‌شده: {selectedAccount.TitleFa} ({selectedAccount.AccountCode})
        </p>
      )}
    </div>
  );
}

export default AccountsPage;
