import React from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';

const PostListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const PostItem = styled.article`
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 2rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);

  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.07);
    transform: translateY(-3px);
  }
`;

const PostTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 0.8rem;
  line-height: 1.4;

  a {
    color: #333;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #3498db;
    }
  }
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #777;
`;

const PostDate = styled.time`
  margin-right: 1.5rem;
  display: flex;
  align-items: center;

  &::before {
    content: '📅';
    margin-right: 0.5rem;
    font-size: 1rem;
  }
`;

const PostTags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PostTag = styled(Link)`
  font-size: 0.85rem;
  padding: 0.2rem 0.6rem;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 3px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: #3498db;
    color: white;
  }
`;

const PostExcerpt = styled.p`
  margin: 0;
  color: #555;
  line-height: 1.6;
  font-size: 1.1rem;
`;

const ReadMore = styled(Link)`
  display: inline-block;
  margin-top: 1.2rem;
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    color: #2980b9;
    text-decoration: underline;
  }

  &::after {
    content: ' →';
  }
`;

const PostList = ({ posts }) => {
  return (
    <PostListContainer>
      {posts.map(({ node }) => {
        const { frontmatter, fields, excerpt } = node;
        const { title, date, tags } = frontmatter;
        const { slug } = fields;

        return (
          <PostItem key={slug}>
            <PostTitle>
              <Link to={slug}>{title}</Link>
            </PostTitle>
            <PostMeta>
              <PostDate>{date}</PostDate>
              {tags && tags.length > 0 && (
                <PostTags>
                  {tags.map((tag) => (
                    <PostTag key={tag} to={`/tags/${tag}/`}>
                      #{tag}
                    </PostTag>
                  ))}
                </PostTags>
              )}
            </PostMeta>
            <PostExcerpt>{excerpt}</PostExcerpt>
            <ReadMore to={slug}>계속 읽기</ReadMore>
          </PostItem>
        );
      })}
    </PostListContainer>
  );
};

export { PostList };
