// components/accounts/AccountTreeSelector.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, ChevronDown, Folder, FileText, Search } from 'lucide-react';

const AccountTreeSelector = ({ onSelect }) => {
  const [accounts, setAccounts] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // دریافت حساب‌ها از API
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/system-settings/accounts/list');
      const accountsData = response.data || [];
      setAccounts(accountsData);
      
      // ساخت درخت حساب‌ها
      const tree = buildAccountTree(accountsData);
      setTreeData(tree);
      
      // باز کردن همه گره‌های سطح اول
      const initialExpanded = {};
      tree.forEach(item => {
        initialExpanded[item.AccountCode] = true;
      });
      setExpandedKeys(initialExpanded);
    } catch (error) {
      console.error('خطا در دریافت حساب‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  // ساخت ساختار درختی حساب‌ها
  const buildAccountTree = (accountsList) => {
    const map = {};
    const roots = [];
    
    // ایجاد یک مپ از همه حساب‌ها
    accountsList.forEach(account => {
      map[account.AccountCode] = {
        ...account,
        children: [],
        level: 0
      };
    });
    
    // ساخت درخت
    accountsList.forEach(account => {
      const node = map[account.AccountCode];
      
      if (account.TopCode && map[account.TopCode]) {
        // اگر والد دارد، به فرزندان والد اضافه کن
        map[account.TopCode].children.push(node);
        node.level = (map[account.TopCode].level || 0) + 1;
      } else {
        // ریشه
        roots.push(node);
      }
    });
    
    // مرتب‌سازی فرزندان بر اساس کد حساب
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => a.AccountCode - b.AccountCode);
        node.children.forEach(child => sortChildren(child));
      }
    };
    
    roots.forEach(root => sortChildren(root));
    return roots.sort((a, b) => a.AccountCode - b.AccountCode);
  };

  // جستجوی حساب
  const searchAccounts = async (query) => {
    setSearchTerm(query);
    if (!query.trim()) {
      fetchAccounts();
      return;
    }
    
    try {
      const response = await axios.get('http://localhost:5000/api/system-settings/accounts/search', {
        params: { query }
      });
      
      const filtered = response.data || [];
      const tree = buildAccountTree(filtered);
      setTreeData(tree);
      
      // باز کردن همه گره‌ها هنگام جستجو
      const allExpanded = {};
      const expandAll = (nodes) => {
        nodes.forEach(node => {
          allExpanded[node.AccountCode] = true;
          if (node.children && node.children.length > 0) {
            expandAll(node.children);
          }
        });
      };
      expandAll(tree);
      setExpandedKeys(allExpanded);
    } catch (error) {
      console.error('خطا در جستجو:', error);
    }
  };

  // باز/بسته کردن گره
  const toggleNode = (accountCode) => {
    setExpandedKeys(prev => ({
      ...prev,
      [accountCode]: !prev[accountCode]
    }));
  };

  // انتخاب حساب
  const handleSelect = (account) => {
    if (onSelect) {
      onSelect(account);
    }
  };

  // کامپوننت بازگشتی برای رندر گره درخت
  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys[node.AccountCode];
    const marginLeft = level * 24;
    
    // تعیین آیکون بر اساس نوع حساب
    const getAccountIcon = () => {
      if (hasChildren) {
        return <Folder className="h-4 w-4 text-blue-500" />;
      }
      
      switch(node.Type) {
        case 'Asset':
          return <FileText className="h-4 w-4 text-green-500" />;
        case 'Liability':
          return <FileText className="h-4 w-4 text-red-500" />;
        case 'Equity':
          return <FileText className="h-4 w-4 text-purple-500" />;
        case 'Income':
          return <FileText className="h-4 w-4 text-yellow-500" />;
        case 'Expense':
          return <FileText className="h-4 w-4 text-orange-500" />;
        default:
          return <FileText className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div className="select-none">
        {/* گره اصلی */}
        <div 
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors ${
            hasChildren ? 'font-semibold' : ''
          }`}
          style={{ paddingRight: `${marginLeft}px` }}
          onClick={() => hasChildren ? toggleNode(node.AccountCode) : handleSelect(node)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {/* آیکون باز/بسته کردن */}
            {hasChildren && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.AccountCode);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
            
            {/* آیکون حساب */}
            <div className="mr-2">
              {getAccountIcon()}
            </div>
            
            {/* اطلاعات حساب */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <span className="text-gray-800">{node.TitleFa}</span>
                  {!hasChildren && (
                    <span className="text-gray-500 text-sm mr-2">
                      ({node.Nature})
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {node.AccountCode}
                  </span>
                </div>
              </div>
              
              {!hasChildren && node.TitleEn && (
                <div className="text-gray-500 text-xs truncate mt-1">
                  {node.TitleEn}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* فرزندان */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNode 
                key={child.AccountCode} 
                node={child} 
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-gray-600">در حال بارگذاری حساب‌ها...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* هدر جستجو */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => searchAccounts(e.target.value)}
            placeholder="جستجوی حساب..."
            className="block w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                fetchAccounts();
              }}
              className="absolute inset-y-0 left-0 pl-3 flex items-center"
            >
              <span className="text-gray-400 hover:text-gray-600">✕</span>
            </button>
          )}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">
            {treeData.length} حساب یافت شد
          </span>
          <button
            onClick={() => {
              const allExpanded = {};
              const expandAll = (nodes) => {
                nodes.forEach(node => {
                  allExpanded[node.AccountCode] = true;
                  if (node.children && node.children.length > 0) {
                    expandAll(node.children);
                  }
                });
              };
              expandAll(treeData);
              setExpandedKeys(allExpanded);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            باز کردن همه
          </button>
          <button
            onClick={() => setExpandedKeys({})}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            بستن همه
          </button>
        </div>
      </div>
      
      {/* بدنه درخت */}
      <div className="flex-1 overflow-y-auto p-4">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            هیچ حسابی یافت نشد
          </div>
        ) : (
          <div className="space-y-1">
            {treeData.map(node => (
              <TreeNode key={node.AccountCode} node={node} />
            ))}
          </div>
        )}
      </div>
      
      {/* فوتر */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded mr-1"></div>
              <span className="text-gray-600">دارایی</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-500 rounded mr-1"></div>
              <span className="text-gray-600">بدهی</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-blue-500 rounded mr-1"></div>
              <span className="text-gray-600">سرمایه</span>
            </div>
          </div>
          <button
            onClick={fetchAccounts}
            className="text-blue-600 hover:text-blue-800"
          >
            بازخوانی
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTreeSelector;