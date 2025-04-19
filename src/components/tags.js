import React from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';

const TagList = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const TagHeader = styled.h3`
  font-size: 1.8rem;
  margin: 0 0 1.5rem 0;
  color: #333;
  font-weight: 600;
`;

const Tag = styled(Link)`
  background: #f5f5f5;
  padding: 0.7rem 1rem;
  border-radius: 6px;
  color: #444;
  text-decoration: none;
  font-size: 1.4rem;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #eee;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #444;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
`;

const TagName = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const TagIcon = styled.span`
  font-size: 1.2rem;
`;

const TagCount = styled.span`
  background: rgba(0, 0, 0, 0.05);
  padding: 0.3rem 0.7rem;
  border-radius: 12px;
  font-size: 1rem;
  color: #666;
  font-weight: 500;

  ${Tag}:hover & {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const Tags = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(limit: 2000) {
        group(field: { frontmatter: { tags: SELECT } }) {
          fieldValue
          totalCount
        }
      }
    }
  `);

  const { group } = data.allMarkdownRemark;

  return (
    <>
      <TagList>
        {group.map((tag) => (
          <Tag key={tag.fieldValue} to={`/tags/${tag.fieldValue}/`}>
            <TagName>
              <TagIcon>#</TagIcon>
              {tag.fieldValue}
            </TagName>
            <TagCount>{tag.totalCount}개 글</TagCount>
          </Tag>
        ))}
      </TagList>
    </>
  );
};

export default Tags;
