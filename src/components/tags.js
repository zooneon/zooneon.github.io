import React from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import styled from 'styled-components';
import {
  tagBackgroundColor,
  tagTextColor,
  tagHoverBackgroundColor,
} from '../utils/theme';

const TagList = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Tag = styled(Link)`
  background: ${tagBackgroundColor};
  padding: 0.7rem 1rem;
  border-radius: 6px;
  color: ${tagTextColor};
  text-decoration: none;
  font-size: 1.4rem;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid
    ${(props) => (props.theme.mode === 'light' ? '#eee' : '#444')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background: ${tagHoverBackgroundColor};
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
  background: ${(props) =>
    props.theme.mode === 'light'
      ? 'rgba(0, 0, 0, 0.05)'
      : 'rgba(255, 255, 255, 0.1)'};
  padding: 0.3rem 0.7rem;
  border-radius: 12px;
  font-size: 1rem;
  color: ${(props) => (props.theme.mode === 'light' ? '#666' : '#ccc')};
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
