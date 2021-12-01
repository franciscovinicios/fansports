import styles from './home.module.scss'
import { useState } from 'react';
import Head from "next/head";


import { FaCalendarAlt } from "react-icons/fa";
import { AiFillTags } from "react-icons/ai";


import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Link from 'next/link'
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  uid: string;
  first_publication_date: string | null;
  tags: string[];
  data: {
    title: string;
    subtitle: string;
    data: string;
  }
};

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}


export default function Home({ postsPagination }: HomeProps) {

  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR
        }
      ),
    };
  });


  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1)


  async function handleNextPage(): Promise<void> {
    console.log(currentPage)
    if (currentPage === 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );



    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page)

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,
        tags: post.tags,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      }
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>

      <Head>
        <title>Inicio | Fansports</title>
      </Head>
    
      <main className={styles.container}>
        <section className={styles.contentContainer}>

          <div className={styles.fans}>
            <img src="fansports.svg" alt="fansports" />
          </div>


          <article className={styles.welcome} >
            <h2>Fansports</h2>
            <p>
              Nós oferecemos as últimas notícias de esportes em geral, resultados, editoriais,
              exclusivos 👏
            </p>
            <hr />

            <h3 className={styles.lastpost}>Post recente</h3>

            <div className={styles.cardContainer}>
              {posts.filter(post => post === posts[0]).map(post => (
                <Link href={`/post/${post.uid}`}key={post.uid}>
                  <a className={styles.card} >
                    <h3>{post.data.title}</h3>

                    <div className={styles.info}>
                      <ul>
                        < AiFillTags />
                        {post.tags.map(tag => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                      <ul className={styles.data}>
                        <FaCalendarAlt />
                        <li> {post.first_publication_date}</li>
                      </ul>
                    </div>

                    <p>
                      {post.data.subtitle}
                    </p>
                  </a>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.sectionPublications}>
          <h2>Publicações</h2>

          <div className={styles.cardContainer}>
            {posts.filter(post => post !== posts[0]).map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a className={styles.card} >
                  <h3>{post.data.title}</h3>

                  <div className={styles.info}>
                    <ul>
                      <AiFillTags />
                      {post.tags.map(tag => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <ul>
                      <FaCalendarAlt />
                      <li> {post.first_publication_date}</li>
                    </ul>
                  </div>

                  <p>
                    {post.data.subtitle}
                  </p>
                </a>
              </Link>
            ))}

            {nextPage && (
              <button type="button" onClick={handleNextPage}>
                Carregar mais posts
              </button>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const primisc = getPrismicClient()
  const postResponse = await primisc.query(
    [Prismic.Predicates.at('document.type', 'publications',)],
    {
      pageSize: 3,
      orderings: '[document.last_publication_date desc]'
    }
  )


  const posts = postResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      tags: post.tags,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
      }
    }
  })

  const postsPagination = {
    next_page: postResponse.next_page,
    results: posts,
  }

  return {
    props: {
      postsPagination,
    }
  }
};
