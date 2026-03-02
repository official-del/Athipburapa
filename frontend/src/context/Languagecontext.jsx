// src/context/LanguageContext.jsx
// ══════════════════════════════════════════════════════
//  ครบในไฟล์เดียว: locales + Context + Provider + hook
//
//  วิธีใช้:
//  1. ครอบ App ด้วย <LanguageProvider> ใน main.jsx
//  2. ในทุก component: const { t, lang, switchLang } = useLanguage()
//  3. แทน text ด้วย t('key') เช่น t('nav_allNews')
// ══════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback } from 'react';
import { translateNewsArray, translateNewsDetail, translateText } from '../services/translationService';

// ─────────────────────────────────────────────────────
//  LOCALES
// ─────────────────────────────────────────────────────
const locales = {

  th: {
    /* Navbar */
    nav_allNews:        'ข่าวทั้งหมด',
    nav_search:         'ค้นหาข่าว...',
    nav_login:          'เข้าสู่ระบบ',
    nav_profile:        'โปรไฟล์',
    nav_admin:          'แอดมิน',
    nav_logout:         'ออกจากระบบ',
    nav_categories:     'หมวดหมู่',

    /* Footer */
    footer_tagline:     'แหล่งข่าวที่คุณไว้วางใจ',
    footer_links:       'ลิงก์ด่วน',
    footer_home:        'หน้าแรก',
    footer_news:        'ข่าวสาร',
    footer_categories:  'หมวดหมู่',
    footer_rights:      'สงวนลิขสิทธิ์',
    footer_followUs:    'ติดตามเราได้ที่',
    footer_aboutUs:     'เกี่ยวกับเรา',
    footer_aboutLink:   'เกี่ยวกับเรา',
    footer_contactLink: 'ติดต่อเรา',
    footer_privacyLink: 'นโยบายความเป็นส่วนตัว',
    footer_termsLink:   'เงื่อนไขการใช้งาน',
    footer_aboutLabel:  'เกี่ยวกับ Athipburapa',
    footer_copyright:   '© 2026 Athipburapa - เว็บไซต์ข่าวสารออนไลน์ สงวนลิขสิทธิ์',

    /* NewsHero */
    hero_latest:        'ข่าวล่าสุด',
    hero_readMore:      'อ่านต่อ',

    /* CategoryFilter */
    cf_title:           'ข่าวสารทั้งหมด',
    cf_all:             'ทั้งหมด',
    cf_noNews:          'ไม่พบข่าวสาร',

    /* NewsDetail */
    nd_back:            'ย้อนกลับ',
    nd_backAll:         'กลับหน้าข่าวสารทั้งหมด',
    nd_home:            'หน้าแรก',
    nd_news:            'ข่าวสาร',
    nd_views:           'วิว',
    nd_viewCount:       'การเข้าชม',
    nd_loading:         'กำลังโหลดข่าวสาร...',
    nd_notFound:        'ไม่พบข่าวที่คุณต้องการ',
    nd_notFoundBack:    'กลับหน้าข่าวสาร',
    nd_tts_listen:      'ฟังข่าวนี้',
    nd_tts_reading:     'กำลังอ่าน...',
    nd_tts_paused:      'หยุดชั่วคราว',
    nd_tts_idle:        'อ่านออกเสียงโดย AI',
    nd_tts_speed:       'ความเร็ว',

    /* CategoryNews */
    cn_category:        'หมวดหมู่ข่าว',
    cn_backAll:         'กลับหน้าข่าวทั้งหมด',
    cn_found:           'พบ',
    cn_foundSuffix:     'ข่าว ในหมวด',
    cn_empty:           'ไม่พบข่าวในหมวด',
    cn_emptyDesc:       'ยังไม่มีข่าวสารในหมวดหมู่นี้ในขณะนี้',
    cn_emptyBtn:        'ดูข่าวทั้งหมด',
    cn_loading:         'กำลังโหลดข่าวสาร...',

    /* Popular */
    popular_title:      'ข่าวยอดนิยม',
    popular_views:      'ครั้ง',

    /* CategoryNews */
    cn_category:        'หมวดหมู่ข่าว',
    cn_backAll:         'กลับหน้าข่าวทั้งหมด',
    cn_found:           'พบ',
    cn_foundSuffix:     'ข่าว ในหมวด',
    cn_empty:           'ไม่พบข่าวในหมวด',
    cn_emptyDesc:       'ยังไม่มีข่าวสารในหมวดหมู่นี้ในขณะนี้',
    cn_emptyBtn:        'ดูข่าวทั้งหมด',
    cn_loading:         'กำลังโหลดข่าวสาร...',

    /* About / Static pages */
    about_title:        'เกี่ยวกับเรา',
    about_content:      'อธิปบูรพา คือแหล่งข่าวสารที่เชื่อถือได้ ครอบคลุมทุกมิติในพื้นที่พัทยาและบริเวณใกล้เคียง เรามุ่งมั่นที่จะนำเสนอข้อมูลที่ถูกต้อง รวดเร็ว และทันสมัย เพื่อให้คุณไม่พลาดทุกเหตุการณ์สำคัญ',
    contact_title:      'ติดต่อเรา',
    contact_content:    'คุณสามารถติดต่อเราได้ผ่านช่องทางโซเชียลมีเดียต่างๆ หรือส่งอีเมลมาที่ ทีมงานของเราพร้อมรับฟังความคิดเห็นและข้อเสนอแนะจากคุณเสมอ',
    privacy_title:      'นโยบายความเป็นส่วนตัว',
    privacy_content:    'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ข้อมูลส่วนบุคคลที่เราเก็บรวบรวมจะถูกนำไปใช้เพื่อพัฒนาการให้บริการและนำเสนอเนื้อหาที่ตรงกับความสนใจของคุณเท่านั้น',
    terms_title:        'เงื่อนไขการใช้งาน',
    terms_content:      'การใช้งานเว็บไซต์ อธิปบูรพา ถือว่าคุณยอมรับเงื่อนไขและข้อตกลงในการใช้งานที่เรากำหนดไว้ โปรดใช้งานอย่างสร้างสรรค์และเคารพสิทธิของผู้อื่น',
    pages_footer:       'ขอขอบคุณที่ไว้วางใจและติดตาม อธิปบูรพา แหล่งข่าวสารออนไลน์อันดับหนึ่งของคนพัทยา',

    /* Auth */
    auth_register:      'สมัครสมาชิก',
    auth_login:         'เข้าสู่ระบบ',
    auth_fullName:      'ชื่อ-นามสกุล',
    auth_username:      'ชื่อผู้ใช้',
    auth_email:         'อีเมล',
    auth_password:      'รหัสผ่าน',
    auth_confirmPwd:    'ยืนยันรหัสผ่าน',
    auth_registerBtn:   'สมัครสมาชิก',
    auth_registeringBtn:'กำลังสมัครสมาชิก...',
    auth_loginBtn:      'เข้าสู่ระบบ',
    auth_loggingBtn:    'กำลังเข้าสู่ระบบ...',
    auth_hasAccount:    'มีบัญชีอยู่แล้ว?',
    auth_noAccount:     'ยังไม่มีบัญชี?',
    auth_toLogin:       'เข้าสู่ระบบ',
    auth_toRegister:    'สมัครสมาชิก',
    auth_phFullName:    'กรุณาใส่ชื่อ-นามสกุล',
    auth_phUsername:    'กรุณาใส่ชื่อผู้ใช้',
    auth_phEmail:       'กรุณาใส่อีเมล',
    auth_phPassword:    'กรุณาใส่รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)',
    auth_phConfirmPwd:  'กรุณาใส่รหัสผ่านอีกครั้ง',
    auth_phLoginPwd:    'กรุณาใส่รหัสผ่าน',
    auth_pwdMismatch:   'รหัสผ่านไม่ตรงกัน',
    auth_pwdTooShort:   'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    auth_errRegister:   'เกิดข้อผิดพลาดในการสมัครสมาชิก',
    auth_errLogin:      'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',

    /* Admin */
    admin_title:        'จัดการข่าวสาร',
    admin_addBtn:       'เพิ่มข่าวใหม่',
    admin_loading:      'กำลังโหลดข้อมูล...',
    admin_noNews:       'ยังไม่มีข่าวสาร',
    admin_noAccess:     'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
    admin_colImg:       'รูปภาพ',
    admin_colTitle:     'หัวข้อข่าว',
    admin_colCat:       'หมวดหมู่',
    admin_colDate:      'วันที่',
    admin_colAction:    'จัดการ',
    admin_noCat:        'ไม่มีหมวดหมู่',
    admin_editTitle:    'แก้ไขข่าว',
    admin_addTitle:     'เพิ่มข่าวใหม่',
    admin_labelTitle:   'หัวข้อข่าว',
    admin_labelCat:     'หมวดหมู่',
    admin_labelImg:     'URL รูปภาพ',
    admin_labelExcerpt: 'คำโปรย (Excerpt)',
    admin_labelContent: 'เนื้อหาข่าว (HTML)',
    admin_labelAuthor:  'ผู้เขียน',
    admin_selectCat:    'เลือกหมวดหมู่',
    admin_cancel:       'ยกเลิก',
    admin_save:         'บันทึก',
    admin_confirmDel:   'ยืนยันการลบ',
    admin_confirmMsg:   'คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
    admin_delete:       'ลบ',
    admin_successAdd:   'สร้างข่าวสำเร็จ',
    admin_successEdit:  'อัปเดตข่าวสำเร็จ',
    admin_successDel:   'ลบข่าวสำเร็จ',
    admin_errLoad:      'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
    admin_errDel:       'เกิดข้อผิดพลาดในการลบข่าว',
    admin_errSave:      'เกิดข้อผิดพลาด',
    /* General */
    readMore:           'อ่านต่อ',
    views:              'ครั้ง',
    noImage:            'ไม่มีรูปภาพ',
  },

  en: {
    /* Navbar */
    nav_allNews:        'All News',
    nav_search:         'Search news...',
    nav_login:          'Sign In',
    nav_profile:        'Profile',
    nav_admin:          'Admin',
    nav_logout:         'Sign Out',
    nav_categories:     'Categories',

    /* Footer */
    footer_tagline:     'Your trusted news source',
    footer_links:       'Quick Links',
    footer_home:        'Home',
    footer_news:        'News',
    footer_categories:  'Categories',
    footer_rights:      'All rights reserved',
    footer_followUs:    'Follow Us',
    footer_aboutUs:     'About Us',
    footer_aboutLink:   'About Us',
    footer_contactLink: 'Contact Us',
    footer_privacyLink: 'Privacy Policy',
    footer_termsLink:   'Terms of Service',
    footer_aboutLabel:  'About Athipburapa',
    footer_copyright:   '© 2026 Athipburapa - Online News Website. All rights reserved.',

    /* NewsHero */
    hero_latest:        'Latest News',
    hero_readMore:      'Read More',

    /* CategoryFilter */
    cf_title:           'All News',
    cf_all:             'All',
    cf_noNews:          'No news found',

    /* NewsDetail */
    nd_back:            'Back',
    nd_backAll:         'Back to All News',
    nd_home:            'Home',
    nd_news:            'News',
    nd_views:           'views',
    nd_viewCount:       'views',
    nd_loading:         'Loading news...',
    nd_notFound:        'News not found',
    nd_notFoundBack:    'Back to News',
    nd_tts_listen:      'Listen to this article',
    nd_tts_reading:     'Reading...',
    nd_tts_paused:      'Paused',
    nd_tts_idle:        'Powered by AI voice',
    nd_tts_speed:       'Speed',

    /* CategoryNews */
    cn_category:        'Category',
    cn_backAll:         'Back to All News',
    cn_found:           'Found',
    cn_foundSuffix:     'articles in',
    cn_empty:           'No news in',
    cn_emptyDesc:       'No articles available in this category yet.',
    cn_emptyBtn:        'Browse All News',
    cn_loading:         'Loading news...',

    /* Popular */
    popular_title:      'Popular News',
    popular_views:      'views',

    /* CategoryNews */
    cn_category:        'หมวดหมู่ข่าว',
    cn_backAll:         'กลับหน้าข่าวทั้งหมด',
    cn_found:           'พบ',
    cn_foundSuffix:     'ข่าว ในหมวด',
    cn_empty:           'ไม่พบข่าวในหมวด',
    cn_emptyDesc:       'ยังไม่มีข่าวสารในหมวดหมู่นี้ในขณะนี้',
    cn_emptyBtn:        'ดูข่าวทั้งหมด',
    cn_loading:         'กำลังโหลดข่าวสาร...',

    /* About / Static pages */
    about_title:        'เกี่ยวกับเรา',
    about_content:      'อธิปบูรพา คือแหล่งข่าวสารที่เชื่อถือได้ ครอบคลุมทุกมิติในพื้นที่พัทยาและบริเวณใกล้เคียง เรามุ่งมั่นที่จะนำเสนอข้อมูลที่ถูกต้อง รวดเร็ว และทันสมัย เพื่อให้คุณไม่พลาดทุกเหตุการณ์สำคัญ',
    contact_title:      'ติดต่อเรา',
    contact_content:    'คุณสามารถติดต่อเราได้ผ่านช่องทางโซเชียลมีเดียต่างๆ หรือส่งอีเมลมาที่ ทีมงานของเราพร้อมรับฟังความคิดเห็นและข้อเสนอแนะจากคุณเสมอ',
    privacy_title:      'นโยบายความเป็นส่วนตัว',
    privacy_content:    'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ข้อมูลส่วนบุคคลที่เราเก็บรวบรวมจะถูกนำไปใช้เพื่อพัฒนาการให้บริการและนำเสนอเนื้อหาที่ตรงกับความสนใจของคุณเท่านั้น',
    terms_title:        'เงื่อนไขการใช้งาน',
    terms_content:      'การใช้งานเว็บไซต์ อธิปบูรพา ถือว่าคุณยอมรับเงื่อนไขและข้อตกลงในการใช้งานที่เรากำหนดไว้ โปรดใช้งานอย่างสร้างสรรค์และเคารพสิทธิของผู้อื่น',
    pages_footer:       'ขอขอบคุณที่ไว้วางใจและติดตาม อธิปบูรพา แหล่งข่าวสารออนไลน์อันดับหนึ่งของคนพัทยา',

    /* Auth */
    auth_register:      'สมัครสมาชิก',
    auth_login:         'เข้าสู่ระบบ',
    auth_fullName:      'ชื่อ-นามสกุล',
    auth_username:      'ชื่อผู้ใช้',
    auth_email:         'อีเมล',
    auth_password:      'รหัสผ่าน',
    auth_confirmPwd:    'ยืนยันรหัสผ่าน',
    auth_registerBtn:   'สมัครสมาชิก',
    auth_registeringBtn:'กำลังสมัครสมาชิก...',
    auth_loginBtn:      'เข้าสู่ระบบ',
    auth_loggingBtn:    'กำลังเข้าสู่ระบบ...',
    auth_hasAccount:    'มีบัญชีอยู่แล้ว?',
    auth_noAccount:     'ยังไม่มีบัญชี?',
    auth_toLogin:       'เข้าสู่ระบบ',
    auth_toRegister:    'สมัครสมาชิก',
    auth_phFullName:    'กรุณาใส่ชื่อ-นามสกุล',
    auth_phUsername:    'กรุณาใส่ชื่อผู้ใช้',
    auth_phEmail:       'กรุณาใส่อีเมล',
    auth_phPassword:    'กรุณาใส่รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)',
    auth_phConfirmPwd:  'กรุณาใส่รหัสผ่านอีกครั้ง',
    auth_phLoginPwd:    'กรุณาใส่รหัสผ่าน',
    auth_pwdMismatch:   'รหัสผ่านไม่ตรงกัน',
    auth_pwdTooShort:   'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    auth_errRegister:   'เกิดข้อผิดพลาดในการสมัครสมาชิก',
    auth_errLogin:      'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',

    /* Admin */
    admin_title:        'จัดการข่าวสาร',
    admin_addBtn:       'เพิ่มข่าวใหม่',
    admin_loading:      'กำลังโหลดข้อมูล...',
    admin_noNews:       'ยังไม่มีข่าวสาร',
    admin_noAccess:     'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
    admin_colImg:       'รูปภาพ',
    admin_colTitle:     'หัวข้อข่าว',
    admin_colCat:       'หมวดหมู่',
    admin_colDate:      'วันที่',
    admin_colAction:    'จัดการ',
    admin_noCat:        'ไม่มีหมวดหมู่',
    admin_editTitle:    'แก้ไขข่าว',
    admin_addTitle:     'เพิ่มข่าวใหม่',
    admin_labelTitle:   'หัวข้อข่าว',
    admin_labelCat:     'หมวดหมู่',
    admin_labelImg:     'URL รูปภาพ',
    admin_labelExcerpt: 'คำโปรย (Excerpt)',
    admin_labelContent: 'เนื้อหาข่าว (HTML)',
    admin_labelAuthor:  'ผู้เขียน',
    admin_selectCat:    'เลือกหมวดหมู่',
    admin_cancel:       'ยกเลิก',
    admin_save:         'บันทึก',
    admin_confirmDel:   'ยืนยันการลบ',
    admin_confirmMsg:   'คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
    admin_delete:       'ลบ',
    admin_successAdd:   'สร้างข่าวสำเร็จ',
    admin_successEdit:  'อัปเดตข่าวสำเร็จ',
    admin_successDel:   'ลบข่าวสำเร็จ',
    admin_errLoad:      'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
    admin_errDel:       'เกิดข้อผิดพลาดในการลบข่าว',
    admin_errSave:      'เกิดข้อผิดพลาด',
    /* CategoryNews */
    cn_category:        'Category',
    cn_backAll:         'Back to All News',
    cn_found:           'Found',
    cn_foundSuffix:     'articles in',
    cn_empty:           'No news in',
    cn_emptyDesc:       'No articles available in this category yet.',
    cn_emptyBtn:        'Browse All News',
    cn_loading:         'Loading news...',

    /* About / Static pages */
    about_title:        'About Us',
    about_content:      'Athipburapa is a trusted news source covering all aspects of Pattaya and surrounding areas. We are committed to delivering accurate, fast, and up-to-date information so you never miss important events.',
    contact_title:      'Contact Us',
    contact_content:    'You can reach us through our social media channels or send us an email. Our team is always ready to hear your feedback and suggestions.',
    privacy_title:      'Privacy Policy',
    privacy_content:    'We value your privacy. Personal information we collect will only be used to improve our services and deliver content tailored to your interests.',
    terms_title:        'Terms of Service',
    terms_content:      'By using Athipburapa, you agree to our terms and conditions. Please use the platform responsibly and respect the rights of others.',
    pages_footer:       'Thank you for trusting and following Athipburapa — Pattaya is number one online news source.',

    /* Auth */
    auth_register:      'Register',
    auth_login:         'Sign In',
    auth_fullName:      'Full Name',
    auth_username:      'Username',
    auth_email:         'Email',
    auth_password:      'Password',
    auth_confirmPwd:    'Confirm Password',
    auth_registerBtn:   'Register',
    auth_registeringBtn:'Registering...',
    auth_loginBtn:      'Sign In',
    auth_loggingBtn:    'Signing in...',
    auth_hasAccount:    'Already have an account?',
    auth_noAccount:     "Don't have an account?",
    auth_toLogin:       'Sign In',
    auth_toRegister:    'Register',
    auth_phFullName:    'Enter your full name',
    auth_phUsername:    'Enter your username',
    auth_phEmail:       'Enter your email',
    auth_phPassword:    'Enter password (at least 6 characters)',
    auth_phConfirmPwd:  'Re-enter your password',
    auth_phLoginPwd:    'Enter your password',
    auth_pwdMismatch:   'Passwords do not match',
    auth_pwdTooShort:   'Password must be at least 6 characters',
    auth_errRegister:   'Registration failed. Please try again.',
    auth_errLogin:      'Login failed. Please try again.',

    /* Admin */
    admin_title:        'News Management',
    admin_addBtn:       'Add News',
    admin_loading:      'Loading data...',
    admin_noNews:       'No news available',
    admin_noAccess:     'You do not have permission to access this page.',
    admin_colImg:       'Image',
    admin_colTitle:     'Title',
    admin_colCat:       'Category',
    admin_colDate:      'Date',
    admin_colAction:    'Actions',
    admin_noCat:        'No category',
    admin_editTitle:    'Edit News',
    admin_addTitle:     'Add New News',
    admin_labelTitle:   'Title',
    admin_labelCat:     'Category',
    admin_labelImg:     'Image URL',
    admin_labelExcerpt: 'Excerpt',
    admin_labelContent: 'Content (HTML)',
    admin_labelAuthor:  'Author',
    admin_selectCat:    'Select category',
    admin_cancel:       'Cancel',
    admin_save:         'Save',
    admin_confirmDel:   'Confirm Delete',
    admin_confirmMsg:   'Are you sure you want to delete this article? This action cannot be undone.',
    admin_delete:       'Delete',
    admin_successAdd:   'News created successfully',
    admin_successEdit:  'News updated successfully',
    admin_successDel:   'News deleted successfully',
    admin_errLoad:      'Failed to load data. Please try again.',
    admin_errDel:       'Failed to delete news.',
    admin_errSave:      'An error occurred.',
    /* General */
    readMore:           'Read More',
    views:              'views',
    noImage:            'No image',
  },

};

// ─────────────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────────────
const LanguageContext = createContext(null);

// ─────────────────────────────────────────────────────
//  PROVIDER
// ─────────────────────────────────────────────────────
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('app_lang') || 'th'
  );

  /* เปลี่ยนภาษา + บันทึกลง localStorage */
  const switchLang = useCallback((newLang) => {
    if (locales[newLang]) {
      setLang(newLang);
      localStorage.setItem('app_lang', newLang);
    }
  }, []);

  /* t('key') → ข้อความตาม locale ปัจจุบัน */
  const t = useCallback((key) => {
    return locales[lang]?.[key] ?? locales['th']?.[key] ?? key;
  }, [lang]);

  /* ── แปล news array (title + category) ── */
  const translateList = useCallback(async (newsArray) => {
    if (lang === 'th') return newsArray;
    return translateNewsArray(newsArray, lang);
  }, [lang]);

  /* ── แปล news detail เดี่ยว (title + content + category) ── */
  const translateDetail = useCallback(async (news) => {
    if (lang === 'th') return news;
    return translateNewsDetail(news, lang);
  }, [lang]);

  /* ── แปลข้อความเดี่ยว (สำหรับ category name ใน URL ฯลฯ) ── */
  const translate = useCallback(async (text) => {
    if (lang === 'th') return text;
    return translateText(text, { to: lang });
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, translateList, translateDetail, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─────────────────────────────────────────────────────
//  HOOK
// ─────────────────────────────────────────────────────
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

// ─────────────────────────────────────────────────────
//  KEY REFERENCE  (copy-paste ไปใช้ใน component)
// ─────────────────────────────────────────────────────
//
//  import { useLanguage } from '../context/LanguageContext';
//  const { t, lang, switchLang } = useLanguage();
//
//  Navbar ──────────────────────────────────────────────
//  t('nav_allNews')       t('nav_search')
//  t('nav_login')         t('nav_profile')
//  t('nav_admin')         t('nav_logout')
//
//  Footer ──────────────────────────────────────────────
//  t('footer_tagline')    t('footer_links')
//  t('footer_home')       t('footer_news')
//  t('footer_categories') t('footer_rights')
//
//  NewsDetail ──────────────────────────────────────────
//  t('nd_back')           t('nd_backAll')
//  t('nd_home')           t('nd_news')
//  t('nd_views')          t('nd_viewCount')
//  t('nd_loading')        t('nd_notFound')
//  t('nd_notFoundBack')   t('nd_tts_listen')
//  t('nd_tts_reading')    t('nd_tts_paused')
//  t('nd_tts_idle')       t('nd_tts_speed')
//
//  CategoryNews ────────────────────────────────────────
//  t('cn_category')       t('cn_backAll')
//  t('cn_found')          t('cn_foundSuffix')
//  t('cn_empty')          t('cn_emptyDesc')
//  t('cn_emptyBtn')       t('cn_loading')
//
//  CategoryFilter ──────────────────────────────────────
//  t('cf_title')          t('cf_all')    t('cf_noNews')
//
//  General ─────────────────────────────────────────────
//  t('readMore')          t('views')     t('noImage')
//  t('popular_title')     t('popular_views')
//
//  ปุ่มเปลี่ยนภาษาใน Navbar ────────────────────────────
//  <button onClick={() => switchLang('th')} className={`nb-lang-btn ${lang==='th'?'active':''}`}>TH</button>
//  <button onClick={() => switchLang('en')} className={`nb-lang-btn ${lang==='en'?'active':''}`}>EN</button>