import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Search from './components/Search';
import Reports from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'inventory' && <Inventory />}
      {activeTab === 'sales' && <Sales />}
      {activeTab === 'search' && <Search />}
      {activeTab === 'reports' && <Reports />}
    </Layout>
  );
}

export default App;
