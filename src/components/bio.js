import React from 'react';
import styled from 'styled-components';
import { StaticQuery, graphql } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';

import media from '../utils/media';
import github from '../images/social/github.svg';
import linkedin from '../images/social/linkedin.svg';
import mail from '../images/social/mail.svg';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 5rem 0;

  ${media.tablet`
    flex-direction: column;
    text-align: center;
  `}
`;

const TextContainer = styled.div`
  ${media.phone`
    order: 2;
  `}
`;

const ImageContainer = styled.div`
  ${media.phone`
    order: 1;
  `}
`;

const Name = styled.h3`
  font-size: 2.4rem;
  letter-spacing: 0.1rem;
  font-weight: 800;
  margin-bottom: 1rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-family: 'system';
`;

const TagLine = styled.sub`
  font-weight: normal;
  font-size: 1.6rem;
  margin: 0;
  display: block;
`;

const SocialIconWrapper = styled.a`
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }
`;

const SocialIcon = styled.img`
  height: 2.5rem;
  width: 2.5rem;
  padding: 1.5rem 1rem;
  filter: ${(props) =>
    props.theme.mode === 'dark' ? 'brightness(1.8)' : 'none'};
  transition: all 0.3s ease;
`;

const Bio = () => (
  <StaticQuery
    query={bioQuery}
    render={(data) => {
      const { author, authorTagline, social } = data.site.siteMetadata;
      const avatar = getImage(data.avatar.childImageSharp.gatsbyImageData);
      return (
        <Container>
          <TextContainer>
            <Name>{author}</Name>
            <TagLine>{authorTagline}</TagLine>
            <SocialIconWrapper
              href={`https://github.com/${social.github}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 프로필"
            >
              <SocialIcon src={github} alt="github" />
            </SocialIconWrapper>
            <SocialIconWrapper
              href={`https://www.linkedin.com/in/${social.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn 프로필"
            >
              <SocialIcon src={linkedin} alt="linkedin" />
            </SocialIconWrapper>
            <SocialIconWrapper
              href={`mailto:${social.mail}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="이메일 보내기"
            >
              <SocialIcon src={mail} alt="mail" />
            </SocialIconWrapper>
          </TextContainer>
          <ImageContainer>
            <GatsbyImage image={avatar} alt={author} />
          </ImageContainer>
        </Container>
      );
    }}
  />
);

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/icon.png/" }) {
      childImageSharp {
        gatsbyImageData(width: 100, height: 100, layout: FIXED)
      }
    }
    site {
      siteMetadata {
        author
        authorTagline
        social {
          github
          linkedin
          mail
        }
      }
    }
  }
`;

export default Bio;
