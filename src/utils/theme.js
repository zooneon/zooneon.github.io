import { createGlobalStyle } from 'styled-components';
import theme from 'styled-theming';

// 배경색 테마
export const backgroundColor = theme('mode', {
  light: '#ffffff',
  dark: '#212121',
});

// 텍스트 색상 테마
export const textColor = theme('mode', {
  light: 'rgba(0, 0, 0, 0.8)',
  dark: 'rgba(255, 255, 255, 0.95)',
});

// 코드 배경색 테마
export const codeBackgroundColor = theme('mode', {
  light: '#7F8487',
  dark: '#545454',
});

// 코드 텍스트 색상 테마
export const codeTextColor = theme('mode', {
  light: '#666',
  dark: '#f0f0f0',
});

// 태그 배경색 테마
export const tagBackgroundColor = theme('mode', {
  light: '#f5f5f5',
  dark: '#404040',
});

// 태그 텍스트 색상 테마
export const tagTextColor = theme('mode', {
  light: '#444',
  dark: '#f0f0f0',
});

// 태그 호버 배경색 테마
export const tagHoverBackgroundColor = theme('mode', {
  light: '#444',
  dark: '#777',
});

// 카드 배경색 테마
export const cardBackgroundColor = theme('mode', {
  light: '#ffffff',
  dark: '#2a2a2a',
});

// 카드 테두리 색상 테마
export const cardBorderColor = theme('mode', {
  light: '#eee',
  dark: '#444',
});

// 헤더 배경색 테마
export const headerBackgroundColor = theme('mode', {
  light: '#ffffff',
  dark: '#212121',
});

// 검색 입력창 배경색 테마
export const searchInputBackgroundColor = theme('mode', {
  light: '#f5f5f5',
  dark: '#404040',
});

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: system;
    font-style: normal;
    font-weight: 300;
    src: local('.SFNSText-Light'), local('.HelveticaNeueDeskInterface-Light'),
      local('.LucidaGrandeUI'), local('Ubuntu Light'), local('Segoe UI Light'),
      local('Roboto-Light'), local('DroidSans'), local('Tahoma');
  }

  :root {
    font-size: 10px;
  }

  body {
    font-family: 'system';
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    background-color: ${backgroundColor};
    color: ${textColor};
    min-height: 100vh;
    position: relative;
    font-size: 1.6rem;
    transition: all 0.3s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: sans-serif;
    color: ${textColor};
  }

  h2 {
    font-size: 2.5rem;
  }

  h3 {
    font-size: 2.4rem;
  }

  h4 {
    font-size: 1.6rem;
  }
  
  code {
    font-family: Menlo,Monaco,"Courier New",Courier,monospace;
    word-break: break-word;
    background-color: ${codeBackgroundColor};
    color: ${codeTextColor};
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre code {
    word-break: normal;
    background-color: transparent;
    padding: 0;
  }

  :not(pre) > code[class*="language-"], pre[class*="language-text"] {
    background-color: transparent;
    color: ${codeTextColor};
    font-size: medium;
  }

  a {
    transition: color 0.2s ease;
    color: ${(props) => (props.theme.mode === 'light' ? '#0366d6' : '#64b5f6')};
  }

  blockquote {
    border-left: 4px solid ${(props) => (props.theme.mode === 'light' ? '#eee' : '#555')};
    background-color: ${(props) => (props.theme.mode === 'light' ? '#f9f9f9' : '#2e2e2e')};
    padding: 1rem;
    margin-left: 0;
    margin-right: 0;
  }

  hr {
    border: none;
    height: 1px;
    background-color: ${(props) => (props.theme.mode === 'light' ? '#eee' : '#555')};
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }

  th, td {
    border: 1px solid ${(props) => (props.theme.mode === 'light' ? '#eee' : '#555')};
    padding: 0.5rem;
  }

  th {
    background-color: ${(props) => (props.theme.mode === 'light' ? '#f5f5f5' : '#404040')};
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;
