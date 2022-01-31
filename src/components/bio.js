import React from 'react';
import styled from 'styled-components';
import { StaticQuery, graphql } from 'gatsby';
import Image from 'gatsby-image';

import media from '../utils/media';
import github from '../images/social/github.svg';
import instagram from '../images/social/instagram.svg';
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

const SocialIcon = styled.img`
  height: 2rem;
  width: 2rem;
  padding: 1.5rem 1rem;
`;

const Bio = () => (
  <StaticQuery
    query={bioQuery}
    render={(data) => {
      const { author, authorTagline, social } = data.site.siteMetadata;
      return (
        <Container>
          <TextContainer>
            <Name>{author}</Name>
            <TagLine>{authorTagline}</TagLine>
            <a
              href={`https://github.com/${social.github}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon src={github} alt="github" />
            </a>
            <a
              href={`https://instagram.com/${social.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon src={instagram} alt="instagram" />
            </a>
            <a
              href={`mailto:${social.mail}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon src={mail} alt="mail" />
            </a>
          </TextContainer>
          <ImageContainer>
            <Image fixed={data.avatar.childImageSharp.fixed} alt={author} />
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
        fixed(width: 100, height: 100) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        authorTagline
        social {
          github
          instagram
          mail
          notion
        }
      }
    }
  }
`;

export default Bio;
