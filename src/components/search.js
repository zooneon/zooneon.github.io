import React, { useState } from 'react';
import { navigate } from 'gatsby';
import styled from 'styled-components';
import media from '../utils/media';
import { tagTextColor, searchInputBackgroundColor } from '../utils/theme';

const SearchContainer = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const SearchForm = styled.form`
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid
    ${(props) => (props.theme.mode === 'light' ? '#eee' : '#444')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:focus-within {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  background: ${searchInputBackgroundColor};
  font-size: 1.4rem;
  outline: none;
  color: ${tagTextColor};
  font-weight: 500;

  &::placeholder {
    color: ${(props) => (props.theme.mode === 'light' ? '#aaa' : '#777')};
  }

  ${media.tablet`
    font-size: 1.3rem;
  `}
`;

const SearchButton = styled.button`
  background: ${(props) => (props.theme.mode === 'light' ? '#444' : '#555')};
  color: white;
  border: none;
  padding: 0 1.4rem;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  &:hover {
    background: ${(props) => (props.theme.mode === 'light' ? '#333' : '#666')};
    transform: translateX(2px);
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

// 검색 아이콘 컴포넌트
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Search = () => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <SearchContainer>
      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          type="text"
          placeholder="블로그 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="블로그 검색"
        />
        <SearchButton type="submit">
          <SearchIcon />
        </SearchButton>
      </SearchForm>
    </SearchContainer>
  );
};

export default Search;
