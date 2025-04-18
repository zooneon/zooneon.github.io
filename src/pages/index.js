import React, { Component } from 'react';
import { graphql } from 'gatsby';
import styled from 'styled-components';

import Layout from '../components/layout';
import Seo from '../components/seo';
import Bio from '../components/bio';
import { PostList } from '../components/PostList';
import media from '../utils/media';

const Title = styled.h3`
  font-weight: 800;
  font-size: 2.6rem;
  margin: 6rem 0 2rem;
  color: ${(props) => (props.theme.mode === 'light' ? '#333' : '#f0f0f0')};

  ${media.phone`
    margin: 3rem 0 1.5rem;
  `}
`;

class BlogIndex extends Component {
  render() {
    const { data } = this.props;
    const posts = data.allMarkdownRemark.edges;
    return (
      <Layout>
        <Bio />
        <main>
          <Title>Latest Posts</Title>
          <PostList posts={posts} />
        </main>
      </Layout>
    );
  }
}

export const Head = () => (
  <Seo
    title="zooneon's log"
    keywords={[`gatsby`, `blog`, `devops`, `zooneon`, `kubernetes`, `aws`]}
  />
);

export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
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
