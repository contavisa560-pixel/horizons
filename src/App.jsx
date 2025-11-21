import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";

import Header from "@/components/Header";
import ChatBot from "@/components/ChatBot";
import RecipeDisplay from "@/components/RecipeDisplay";
import { Toaster } from "@/components/ui/toaster";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileSetup from "@/components/ProfileSetup";
import Dashboard from "@/components/Dashboard";
import UserProfile from "@/components/UserProfile";
import Subscription from "@/components/Subscription";
import Marketplace from "@/components/Marketplace";
import ImageRecognition from "@/components/ImageRecognition";
import VoiceRecognition from "@/components/VoiceRecognition";
import InternationalRecipes from "@/components/InternationalRecipes";
import AuthSuccess from "@/pages/AuthSuccess";

import "./checkEnv.js";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState("welcome");
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // -----------------------------------------------------------------------
  // 1️⃣   PROCESSAR LOGIN VIA GOOGLE (token + user enviados pelo backend)
  // -----------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userParam = params.get("user");

    if (token && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));

        localStorage.setItem("bomPiteuUser", JSON.stringify(parsedUser));
        localStorage.setItem("bomPiteuToken", token);

        setUser(parsedUser);
        setCurrentView("dashboard");

        // limpar URL
        navigate("/", { replace: true });
      } catch (err) {
        console.error(" Erro ao processar retorno Google:", err);
      }
    }
  }, [location, navigate]);

  // -----------------------------------------------------------------------
  // 2️⃣   CARREGAR USER DO LOCALSTORAGE AO ABRIR A APP
  // -----------------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("bomPiteuUser");
    if (saved) {
      setUser(JSON.parse(saved));
      setCurrentView("dashboard");
    }
  }, []);

  // -----------------------------------------------------------------------
  // 3️⃣   OUVIR EVENTO GLOBAL DE ATUALIZAÇÃO DO USER
  // -----------------------------------------------------------------------
  useEffect(() => {
    const syncUser = (e) => setUser(e.detail);

    window.addEventListener("user_updated", syncUser);
    return () => window.removeEventListener("user_updated", syncUser);
  }, []);

  // -----------------------------------------------------------------------
  // 4️⃣   ATUALIZAR USER GLOBAL
  // -----------------------------------------------------------------------
  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem("bomPiteuUser", JSON.stringify(updated));
  };

  // -----------------------------------------------------------------------
  // 5️⃣   LOGIN NORMAL / REGISTO
  // -----------------------------------------------------------------------
  const handleLogin = (profile) => {
    const newUser = {
      ...profile,
      level: 1,
      points: 0,
      favorites: [],
      isPremium: false,
      foodProfile: [],
      age: "",
      bloodType: "A+",
      country: "AO",
      language: "pt",
      interests: [],
    };

    localStorage.setItem("bomPiteuUser", JSON.stringify(newUser));
    setUser(newUser);
    setCurrentView("dashboard");
  };

  // -----------------------------------------------------------------------
  // 6️⃣  GUARDAR PERFIL
  // -----------------------------------------------------------------------
  const handleProfileSave = (profileData) => {
    updateUser(profileData);
    setCurrentView("dashboard");
  };

  // -----------------------------------------------------------------------
  // 7️⃣  LOGOUT
  // -----------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("bomPiteuUser");
    localStorage.removeItem("bomPiteuToken");

    setUser(null);
    setCurrentView("welcome");
  };

  // -----------------------------------------------------------------------
  // 8️⃣  NAVEGAÇÃO INTERNA
  // -----------------------------------------------------------------------
  const handleNavigate = (view) => {
    setCurrentRecipe(null);
    setCurrentView(view);
  };

  // -----------------------------------------------------------------------
  // 9️⃣  RECEITA GERADA
  // -----------------------------------------------------------------------
  const handleRecipeGenerated = (recipe) => {
    updateUser({ points: (user.points || 0) + 25 });
    setCurrentRecipe(recipe);
    setCurrentView("recipe");
  };

  // -----------------------------------------------------------------------
  // 🔟  FAVORITOS
  // -----------------------------------------------------------------------
  const handleToggleFavorite = (recipeTitle) => {
    const isFavorite = user.favorites.includes(recipeTitle);

    const updated = isFavorite
      ? user.favorites.filter((fav) => fav !== recipeTitle)
      : [...user.favorites, recipeTitle];

    updateUser({ favorites: updated });
    return !isFavorite;
  };

  // -----------------------------------------------------------------------
  //  VIEW RENDER
  // -----------------------------------------------------------------------
  const renderContent = () => {
    switch (currentView) {
      case "welcome":
        return <WelcomeScreen onLogin={handleLogin} />;

      case "profileSetup":
        return (
          <ProfileSetup
            onSave={handleProfileSave}
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case "chat":
        return (
          <ChatBot
            selectedCategory={selectedCategory}
            onRecipeGenerated={handleRecipeGenerated}
            onBack={() => handleNavigate("dashboard")}
            user={user}
          />
        );

      case "recipe":
        return (
          <RecipeDisplay
            recipe={currentRecipe}
            onBack={() => handleNavigate("dashboard")}
            user={user}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case "profile":
        return <UserProfile user={user} onNavigate={handleNavigate} />;

      case "subscription":
        return (
          <Subscription
            user={user}
            onSubscribe={(plan) => {
              updateUser({ isPremium: plan !== "free" });
              handleNavigate("dashboard");
            }}
            onNavigate={handleNavigate}
          />
        );

      case "marketplace":
        return <Marketplace onNavigate={handleNavigate} />;

      case "imageRecognition":
        return (
          <ImageRecognition
            onNavigate={handleNavigate}
            onStartChat={(category) => {
              setSelectedCategory(category);
              handleNavigate("chat");
            }}
            user={user}
          />
        );

      case "voiceRecognition":
        return (
          <VoiceRecognition
            onNavigate={handleNavigate}
            onStartChat={(category) => {
              setSelectedCategory(category);
              handleNavigate("chat");
            }}
            user={user}
          />
        );

      case "internationalRecipes":
        return (
          <InternationalRecipes
            onNavigate={handleNavigate}
            onStartChat={(category) => {
              setSelectedCategory(category);
              handleNavigate("chat");
            }}
          />
        );

      case "dashboard":
      default:
        return (
          <Dashboard
            onStartChat={(category) => {
              setSelectedCategory(category);
              handleNavigate("chat");
            }}
            onNavigate={handleNavigate}
            user={user}
          />
        );
    }
  };

  // -----------------------------------------------------------------------
  //  UI GLOBAL
  // -----------------------------------------------------------------------
  return (
    <>
      <Helmet>
        <title>Bom Piteu! – A tua cozinha inteligente</title>
        <meta
          name="description"
          content="Assistente culinário inteligente com receitas personalizadas, visão, voz e IA."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 
        dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">

        {user && currentView !== "welcome" && (
          <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
        )}

        <main className="container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Toaster />
      </div>
    </>
  );
}

export default App;
