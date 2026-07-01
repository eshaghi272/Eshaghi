import { useState, useEffect } from 'react';

import GroupManager from './GroupManager';
import TabManager from './TabManager';
import SidebarItemManager from './SidebarItemManager';

const LayoutManager = () => {
  const [activeSection, setActiveSection] = useState('groups');

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">مدیریت ساختار سیستم</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveSection('groups')} className={`btn ${activeSection === 'groups' ? 'btn-primary' : 'btn-outline'}`}>گروه‌ها</button>
        <button onClick={() => setActiveSection('tabs')} className={`btn ${activeSection === 'tabs' ? 'btn-primary' : 'btn-outline'}`}>تب‌ها</button>
        <button onClick={() => setActiveSection('sidebar')} className={`btn ${activeSection === 'sidebar' ? 'btn-primary' : 'btn-outline'}`}>سایدبار</button>
      </div>

      {activeSection === 'groups' && <GroupManager />}
      {activeSection === 'tabs' && <TabManager />}
      {activeSection === 'sidebar' && <SidebarItemManager />}
    </div>
  );
};

export default LayoutManager;
