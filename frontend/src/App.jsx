import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import CategoryNews from './pages/CategoryNews'
import SearchResults from './pages/SearchResults'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminVideoManagement from './pages/AdminVideoManagement'
import AdminOverview from './pages/AdminOverview'
import VideoPage from './pages/VideoPage'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/'              element={<Home />} />
        <Route path='/news'          element={<News />} />
        <Route path='/news/:id'      element={<NewsDetail />} />
        <Route path='/news/category/:categoryName' element={<CategoryNews />} />
        <Route path='/search'        element={<SearchResults />} />
        <Route path='/videos'        element={<VideoPage />} />
        <Route path='/login'         element={<Login />} />
        <Route path='/register'      element={<Register />} />
        <Route path='/profile'       element={<Profile />} />
        <Route path='/admin'         element={<AdminDashboard />} />
        <Route path='/admin/videos'  element={<AdminVideoManagement />} />
        <Route path='/admin/overview' element={<AdminOverview />} />  {/* ✅ ใหม่ */}
        <Route path='/about'         element={<About />} />
        <Route path='/contact'       element={<About />} />
        <Route path='/privacy'       element={<About />} />
        <Route path='/terms'         element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App