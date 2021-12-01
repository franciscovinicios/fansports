import Head from "next/head";
import styles from './post.module.scss'
import Prismic from '@prismicio/client'
import Link from 'next/link'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FaCalendarAlt } from "react-icons/fa";
import { AiFillTags } from "react-icons/ai";
import { getPrismicClient } from "../../services/prismic";
import { RichText } from "prismic-dom";

import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from "next/dist/client/router";


interface Post {
  uid: string
  first_publication_date: string | null;
  last_publication_date: string | null;
  tags: String[];
  data: {
    title: string;
    banner?: {
      url: string;
    };
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[]
  }
}


export default function Post({ post, navigation }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const formateDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR
    }
  )


  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <header>
        <img src={post.data.banner.url} className={styles.banner} />
        <main className={styles.container}>
          <div className={styles.post}>
            <div className={styles.postTop}>
              <h1>{post.data.title}</h1>

              <div className={styles.info}>
                <ul>
                  <AiFillTags />
                  {post.tags.map(tag => (
                    <li>{tag}</li>
                  ))}
                </ul>

                <ul>
                  <FaCalendarAlt />
                  <li>{formateDate}</li>
                </ul>
              </div>
            </div>

            {post.data.content.map(content => {
              return (
                <article key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body)
                    }}
                  />
                </article>
              )
            })}
          </div>

          <section className={`${styles.navigation} ${styles.container}`}>
            {navigation.prevPost.length > 0 && (
              <div>
                <p>{navigation.prevPost[0].data.title}</p>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a> Post anterior</a>
                </Link>
              </div>
            )}
            {navigation?.nextPost.length > 0 && (
              <div>
                <p>{navigation.nextPost[0].data.title}</p>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a> Proximo post </a>
                </Link>
              </div>
            )}
          </section>
        </main>
      </header>
    </>
  )
}


export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'publications')
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};


export const getStaticProps: GetStaticProps = async ({ params, preview = false}) => {
  const prismic = getPrismicClient()
  const { slug } = params;
  const response = await prismic.getByUID('publications', String(slug), {});


  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'publications')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  )

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'publications')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date ]'
    }
  )

 

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    tags: response.tags,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  }


  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      },
    }
  }
}
