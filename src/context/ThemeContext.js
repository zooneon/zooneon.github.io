import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { GlobalStyle } from '../utils/theme';

// 테마 컨텍스트 생성
export const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

// 테마 상태 관리 및 Provider 컴포넌트
export const ThemeProvider = ({ children }) => {
  // 로컬 스토리지에서 테마 상태 불러오기 (기본값: light)
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    // 브라우저에서만 실행되도록 체크
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // 저장된 테마가 있으면 사용, 없으면 시스템 설정 확인
      if (savedTheme) {
        setThemeMode(savedTheme);
      } else if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        setThemeMode('dark');
      }
    }
  }, []);

  // 테마 토글 함수
  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    // 로컬 스토리지에 테마 상태 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // 테마 컨텍스트 값
  const themeContext = {
    mode: themeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeContext}>
      <StyledThemeProvider theme={{ mode: themeMode }}>
        <GlobalStyle />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
