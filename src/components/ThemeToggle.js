import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../context/ThemeContext';

const ToggleContainer = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) =>
      props.theme.mode === 'light'
        ? 'rgba(0, 0, 0, 0.05)'
        : 'rgba(255, 255, 255, 0.1)'};
  }

  &:focus {
    outline: none;
  }
`;

const IconSVG = styled.svg`
  width: 20px;
  height: 20px;
  fill: none;
  stroke: ${(props) => (props.theme.mode === 'light' ? '#555' : '#eee')};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.3s ease;
`;

const ThemeToggle = () => {
  const { mode, toggleTheme } = useContext(ThemeContext);

  return (
    <ToggleContainer
      onClick={toggleTheme}
      aria-label={`${mode === 'light' ? '다크모드로 전환' : '라이트모드로 전환'}`}
      title={`${mode === 'light' ? '다크모드로 전환' : '라이트모드로 전환'}`}
    >
      {mode === 'light' ? (
        <IconSVG viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </IconSVG>
      ) : (
        <IconSVG viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </IconSVG>
      )}
    </ToggleContainer>
  );
};

export default ThemeToggle;
