import React, { useState } from "react";
import { Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import TextProcessor from "./TextProcessor";
import Settings from "./Settings";
import "./Home.css";

const Home: React.FC = () => {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <div className="home-container">
      <Button
        type="text"
        icon={<SettingOutlined />}
        onClick={() => setOpenSettings(true)}
        className="settings-button"
      />
      <TextProcessor />
      <Settings isOpen={openSettings} onClose={() => setOpenSettings(false)} />
    </div>
  );
};

export default Home;
