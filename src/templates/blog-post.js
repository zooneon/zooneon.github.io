import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Utterances from '../components/utterances';
import { Container, Title, LinkList, Header } from './post-styles';
import Share from '../components/share';
import StyledLink from '../utils/styled-link';

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark;
    const siteTitle = this.props.data.site.siteMetadata.title;
    const author = this.props.data.site.siteMetadata.author;
    const { previous, next } = this.props.pageContext;

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO title={post.frontmatter.title} description={post.excerpt} />
        <Container>
          <Header>
            <Title>{post.frontmatter.title}</Title>
            <sub
              css={`
                color: rgba(0, 0, 0, 0.8);
              `}
            >
              <span>Posted on {post.frontmatter.date}</span>
              <span>&nbsp; - &nbsp;</span>
              <span>{post.fields.readingTime.text}</span>
            </sub>
          </Header>
          <div
            css={`
              margin: 5rem 0;
            `}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <LinkList>
            <li>
              {previous && (
                <StyledLink to={previous.fields.slug} rel="prev">
                  ← {previous.frontmatter.title}
                </StyledLink>
              )}
            </li>
            <li>
              {next && (
                <StyledLink to={next.fields.slug} rel="next">
                  {next.frontmatter.title} →
                </StyledLink>
              )}
            </li>
          </LinkList>
          <Utterances />
          <Share
            post={{
              title: post.frontmatter.title,
              excerpt: post.excerpt,
              author: author,
            }}
          />
        </Container>
      </Layout>
    );
  }
}

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt
      html
      fields {
        readingTime {
          text
        }
      }
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
      }
    }
  }
`;
