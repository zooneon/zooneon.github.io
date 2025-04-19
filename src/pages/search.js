import React, { useState, useEffect } from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import SEO from '../components/seo';
import { PostList } from '../components/PostList';
import styled from 'styled-components';
import media from '../utils/media';

const SearchPageContainer = styled.div`
  width: 100%;
`;

const SearchResultHeader = styled.div`
  margin: 2rem 0 3rem;
`;

const SearchTitle = styled.h1`
  font-size: 2.2rem;
  color: ${(props) => (props.theme.mode === 'light' ? '#333' : '#f5f5f5')};
  margin-bottom: 1rem;

  ${media.tablet`
    font-size: 1.8rem;
  `}
`;

const SearchResultInfo = styled.p`
  color: ${(props) => (props.theme.mode === 'light' ? '#666' : '#d0d0d0')};
  font-size: 1.3rem;
`;

const NoResults = styled.div`
  margin: 4rem 0;
  color: ${(props) => (props.theme.mode === 'light' ? '#666' : '#d0d0d0')};

  h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: ${(props) => (props.theme.mode === 'light' ? '#333' : '#f0f0f0')};
  }

  p {
    font-size: 1.4rem;
  }
`;

const SearchPage = ({ data, location }) => {
  const allPosts = data.allMarkdownRemark.edges;
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);

    if (query) {
      // 검색어를 소문자로 변환
      const lowerCaseQuery = query.toLowerCase();

      // 제목, 태그, 내용에서 검색
      const filteredPosts = allPosts.filter(({ node }) => {
        const { title, tags } = node.frontmatter;
        const { excerpt } = node;

        const titleMatch =
          title && title.toLowerCase().includes(lowerCaseQuery);
        const tagsMatch =
          tags &&
          tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery));
        const contentMatch =
          excerpt && excerpt.toLowerCase().includes(lowerCaseQuery);

        return titleMatch || tagsMatch || contentMatch;
      });

      setSearchResults(filteredPosts);
    } else {
      setSearchResults([]);
    }
  }, [location.search, allPosts]);

  return (
    <Layout>
      <SEO title={searchQuery ? `"${searchQuery}" 검색 결과` : '검색'} />
      <SearchPageContainer>
        {searchQuery ? (
          <>
            <SearchResultHeader>
              <SearchTitle>"{searchQuery}" 검색 결과</SearchTitle>
              <SearchResultInfo>
                {searchResults.length}개의 포스트를 찾았습니다
              </SearchResultInfo>
            </SearchResultHeader>

            {searchResults.length > 0 ? (
              <PostList posts={searchResults} />
            ) : (
              <NoResults>
                <h2>검색 결과가 없습니다</h2>
                <p>다른 검색어로 다시 시도해보세요</p>
              </NoResults>
            )}
          </>
        ) : (
          <SearchResultHeader>
            <SearchTitle>검색어를 입력하세요</SearchTitle>
          </SearchResultHeader>
        )}
      </SearchPageContainer>
    </Layout>
  );
};

export default SearchPage;

export const pageQuery = graphql`
  query {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      edges {
        node {
          id
          excerpt(pruneLength: 160)
          fields {
            slug
            readingTime {
              text
            }
          }
          frontmatter {
            date(formatString: "YYYY년 MM월 DD일")
            title
            tags
          }
        }
      }
    }
  }
`;
