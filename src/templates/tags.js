import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import Seo from '../components/seo';
import styled from 'styled-components';
import { PostList } from '../components/PostList';

const TagHeader = styled.div`
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid
    ${(props) => (props.theme.mode === 'light' ? '#eee' : '#444')};
`;

const TagTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${(props) => (props.theme.mode === 'light' ? '#333' : '#f5f5f5')};
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const TagSymbol = styled.span`
  color: ${(props) => (props.theme.mode === 'light' ? '#3498db' : '#64b5f6')};
  font-weight: normal;
`;

const TagDescription = styled.p`
  color: ${(props) => (props.theme.mode === 'light' ? '#777' : '#d0d0d0')};
  font-size: 1.2rem;
  margin: 0;
`;

const TagTemplate = ({ data, pageContext }) => {
  const { tag } = pageContext;
  const { edges, totalCount } = data.allMarkdownRemark;
  const tagHeader = `${totalCount}개의 포스트가 이 태그에 해당됩니다`;

  return (
    <Layout>
      <TagHeader>
        <TagTitle>
          <TagSymbol>#</TagSymbol>
          {tag}
        </TagTitle>
        <TagDescription>{tagHeader}</TagDescription>
      </TagHeader>
      <PostList posts={edges} />
    </Layout>
  );
};

export const Head = ({ pageContext }) => {
  const { tag } = pageContext;
  return <Seo title={`"${tag}" 태그의 포스트 목록`} />;
};

export default TagTemplate;

export const pageQuery = graphql`
  query ($tag: String) {
    allMarkdownRemark(
      limit: 2000
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          excerpt
          fields {
            slug
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
