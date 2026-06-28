import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Tree from "rc-tree";
import "rc-tree/assets/index.css";

function AccountSelectorPage() {
  const [treeData, setTreeData] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const idx = location.state?.idx;

  useEffect(() => {
    const fetchData = async () => {
      const groupsRes = await fetch("http://127.0.0.1:8000/account-groups");
      const groups = await groupsRes.json();
      const accountsRes = await fetch("http://127.0.0.1:8000/accounts");
      const accounts = await accountsRes.json();

      const data = groups.map((g) => ({
        key: `group-${g.GroupCode}`,
        title: `${g.TitleFa} (${g.GroupCode})`,
        children: accounts
          .filter((a) => a.GroupCode === g.GroupCode)
          .map((acc) => ({
            key: `account-${acc.AccountCode}`,
            title: `${acc.TitleFa} (${acc.AccountCode})`,
            isLeaf: true,
            data: acc,
          })),
      }));
      setTreeData(data);
    };
    fetchData();
  }, []);

  const handleSelect = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      navigate("/", {
        state: { selectedAccount: { idx, account: info.node.data } },
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>🌳 انتخاب حساب</h3>
      <Tree treeData={treeData} defaultExpandAll onSelect={handleSelect} />
      <button onClick={() => navigate("/")}>بازگشت</button>
    </div>
  );
}

export default AccountSelectorPage;
